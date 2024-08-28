import fs from 'fs';
import { readFile, rm, stat } from 'fs/promises';

import path from 'path';
import { DeviceMetadata, ipc } from '../../types/customTypes';
import storage from '../storage';
import fileExists from '../util/fileExists';
import getDeviceMetadata from '../util/getMetaData';
import keylogger from '../util/keylogger';
import logger from '../util/logger';
import { fixWebmDuration } from '../util/remuxVideo';
import {
  getCurrentRecordingFolder,
  markRecordingStarted,
  markRecordingStopped,
  storeRecordingSize,
} from '../util/storageHelpers';
import UploadManager from '../util/UploadManager';
// import {
//   closeAllHintWindows,
//   closeOverLayWindow,
//   expandOverlayWindow,
//   showHintWindows,
//   shrinkOverlayWindow,
// } from './staticWindows';
import getVideoStoragePath from '../util/videoStorage';
import { ipcHandle } from './typeSafeHandler';
import axiosInstance from '../util/axiosInstance';

const log = logger.child({ module: 'ipc.record' });

let chunksWritten = 0;
let chunkQueue: Promise<number> = Promise.resolve(0);

ipcHandle('start-new-recording', async () => {
  log.info('Recording started');
  chunksWritten = 0;
  await markRecordingStarted();
  keylogger.startLogging();
  log.info('Keystrokes logging started');
  // showHintWindows();
  return ipc.success(undefined);
});

async function writeKeylogToFile(
  keylog: string | null,
  recordingFolder: string,
) {
  if (!keylog) {
    log.info('Keystrokes logging stopped. No logs found.');
    return;
  }

  const keylogPath = `${recordingFolder}/keylog.txt`;
  await fs.promises.writeFile(keylogPath, keylog);
  log.info('Keystrokes log saved.');
}

async function writeMetadataToFile(metadata: string, recordingFolder: string) {
  const metadataPath = `${recordingFolder}/metadata.json`;
  await fs.promises.writeFile(metadataPath, metadata);
  log.info('Metadata saved.');
}

async function writeVideoToFile(recordingFolder: string) {
  try {
    const videoPath = `${recordingFolder}/temp-video.webm`;
    await chunkQueue;
    log.info('All chunks written to the video file, fix webm duration');
    await fixWebmDuration(videoPath, recordingFolder);

    // Store the video file size in the database
    const folderId = recordingFolder.split('/').pop();
    const videoStats = await stat(videoPath);
    if (!folderId) {
      log.error('Failed to get folderId from recordingFolder', {
        recordingFolder,
      });
      throw new Error('Failed to get folderId from recordingFolder');
    }
    await storeRecordingSize(folderId, videoStats.size);

    return true;
  } catch (error) {
    log.error('Failed to remux the video file.', error);
    throw error;
  }
}

ipcHandle(
  'stop-recording',
  async (event, recordingStopTime: number, recordingStartTime: number) => {
    let recordingFolderName = '';
    try {
      log.info('Stopping recording');
      const recordingFolder = await getCurrentRecordingFolder();
      const db = await storage.getData();
      recordingFolderName = db.currentRecordingFolder!.folderName;
      const logContent = keylogger.stopLogging(recordingStopTime);
      const metadata: DeviceMetadata = await getDeviceMetadata();
      metadata.duration = recordingStopTime - recordingStartTime;
      await markRecordingStopped();

      log.info('Recording stopped');

      await writeKeylogToFile(logContent, recordingFolder);

      await writeMetadataToFile(JSON.stringify(metadata), recordingFolder);

      await writeVideoToFile(recordingFolder);

      return ipc.success({ recordingFolderName });
    } catch (err) {
      log.error('Failed during stop recording', { err });
      return ipc.error('Error while saving the recording', {
        err,
        recordingFolderName,
      });
    }
  },
);

ipcHandle('get-unique-keys', async () => {
  const uniqueKeys = keylogger.getUniqueKeys();
  return ipc.success(uniqueKeys);
});

ipcHandle('get-games-list', async () => {
  try {
    const games = await axiosInstance.get('/games-list');
    return ipc.success(games.data);
  } catch (err) {
    log.error('Failed to get games list', { err });
    return ipc.error('Failed to get games list', err);
  }
});

ipcHandle(
  'rename-recording',
  async (event, folderId, newName, description, game, controls) => {
    try {
      const db = await storage.getData();
      const folder = db.recordingFolders.find((f) => f.id === folderId);
      if (!folder) {
        throw new Error('Folder not found');
      }
      folder.description = description;
      folder.folderName = newName.trim();
      folder.game = game;
      await storage.save(db);

      const folderPath = path.join(getVideoStoragePath(), folderId);
      const metadataPath = path.join(folderPath, 'metadata.json');
      const controlsPath = path.join(folderPath, 'controls.json');

      if (fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(
          await fs.promises.readFile(metadataPath, 'utf-8'),
        );
        metadata.game = game;
        metadata.videoTitle = newName.trim();
        metadata.videoDescription = description;
        await fs.promises.writeFile(
          metadataPath,
          JSON.stringify(metadata, null, 2),
        );
        log.info('Metadata updated successfully', { metadataPath });
      } else {
        log.warn('metadata.json file not found', { metadataPath });
      }

      await fs.promises.writeFile(
        controlsPath,
        JSON.stringify(controls, null, 2),
      );
      log.info('Controls updated successfully', { controlsPath });

      return ipc.success(undefined);
    } catch (err) {
      log.error('Failed to rename recording', { err });
      return ipc.error('Failed to rename recording', err);
    }
  },
);

// Discard recording from FileOptions page,
// deletes only one folder, that was just recorded.
ipcHandle('discard-recording', async (event, folderId) => {
  try {
    const db = await storage.getData();
    db.recordingFolders = db.recordingFolders.filter(
      (folder) => folder.id !== folderId,
    );
    await storage.save(db);

    // Delete the folder on disk
    const folderPath = `${getVideoStoragePath()}/${folderId}`;

    // Delete all files in the folder first
    const files = await fs.promises.readdir(folderPath);
    await Promise.all(
      files.map(async (file) => {
        try {
          const filePath = path.join(folderPath, file);
          await fs.promises.unlink(filePath);
          return true;
        } catch (err) {
          log.error('Failed to delete file', { err });
          return false;
        }
      }),
    );

    // Then remove the directory
    rm(folderPath, { recursive: true, force: true });

    return ipc.success(undefined);
  } catch (err) {
    log.error('Failed to discard recording', { err });
    return ipc.error('Failed to discard recording', err);
  }
});

ipcHandle('discard-multiple-recordings', async (event, folderIds) => {
  try {
    const db = await storage.getData();
    db.recordingFolders = db.recordingFolders.filter(
      (folder) => !folderIds.includes(folder.id),
    );
    await storage.save(db);

    // Delete the folders on disk
    const deletePromises = folderIds.map((folderId) =>
      rm(`${getVideoStoragePath()}/${folderId}`, {
        recursive: true,
        force: true,
      }),
    );

    const results = await Promise.allSettled(deletePromises);

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        log.error(`Failed to delete folder ${folderIds[index]}`, {
          error: result.reason,
        });
      }
      UploadManager.getInstance().updateOnDiscardComplete(folderIds[index]);
    });

    return ipc.success(undefined);
  } catch (err) {
    log.error('Failed to discard multiple recordings', { err });
    return ipc.error('Failed to discard multiple recordings', err);
  }
});

ipcHandle('get-recording-resolution', async (event, folderId) => {
  try {
    const metadata = await readFile(
      `${getVideoStoragePath()}/${folderId}/metadata.json`,
      'utf-8',
    );
    const metadataJson = JSON.parse(metadata);
    log.info('Got recording resolution', {
      width: metadataJson.screenSize.width,
      height: metadataJson.screenSize.height,
    });
    if (!metadataJson.screenSize.width || !metadataJson.screenSize.height) {
      return ipc.error('Failed to get recording resolution');
    }
    return ipc.success({
      width: metadataJson.screenSize.width as number,
      height: metadataJson.screenSize.height as number,
    });
  } catch (err) {
    log.error('Failed to get recording resolution', { err });
    return ipc.error('Failed to get recording resolution', err);
  }
});
const getFoldersForDeletion = async (
  folderIds: string[],
  cleanUpAll?: boolean,
) => {
  if (cleanUpAll) {
    const db = await storage.getData();
    return db.recordingFolders
      .filter((folder) => folder.isUploaded && !folder.isDeletedFromLocal)
      .map((folder) => folder.id);
  }
  return folderIds;
};

const updateFoldersInStorage = async (folderIdsForDeletion: string[]) => {
  const db = await storage.getData();
  const folders = db.recordingFolders.filter((f) =>
    folderIdsForDeletion.includes(f.id),
  );

  if (folders.length === 0) {
    log.error('Clean Up From local, Folders not found in application storage', {
      folderIds: folderIdsForDeletion,
    });
    log.error('Will continue to delete the folders from the disk');
  } else {
    folders.forEach((folder) => {
      folder.isDeletedFromLocal = true;
    });
    await storage.save(db);
  }
};

const deleteFoldersOnDisk = async (folderIdsForDeletion: string[]) => {
  const deletePromises = folderIdsForDeletion.map(async (folderId) => {
    try {
      const folderPath = `${getVideoStoragePath()}/${folderId}`;
      const isAvailableInLocal = await fileExists(folderPath);
      if (!isAvailableInLocal) {
        log.info('Folder already deleted from local', { folderId });
        return;
      }

      rm(folderPath, { recursive: true, force: true });
      UploadManager.getInstance().updateOnDiscardComplete(folderId);
    } catch (err) {
      log.error(`Failed to delete folder ${folderId}`, { err });
      throw err;
    }
  });

  const results = await Promise.allSettled(deletePromises);

  results.forEach((result, index) => {
    if (result.status !== 'fulfilled') {
      log.error(`Failed to delete folder ${folderIdsForDeletion[index]}`, {
        error: result.reason,
      });
    }
  });
};
/**
 * Either send the folderIds to clean up from local or clean up all
 * clean up all will clean up all the folders that are marked as isUploaded
 */

ipcHandle('clean-up-from-local', async (event, folderIds, cleanUpAll) => {
  try {
    const folderIdsForDeletion = await getFoldersForDeletion(
      folderIds,
      cleanUpAll,
    );
    await updateFoldersInStorage(folderIdsForDeletion);
    await deleteFoldersOnDisk(folderIdsForDeletion);
    return ipc.success(undefined);
  } catch (err) {
    log.error('Failed to clean up from local', { err });
    return ipc.error('Failed to clean up from local', err);
  }
});

ipcHandle('get-recording-memory-usage', async () => {
  const videoStoragePath = getVideoStoragePath();
  // get the memory occupied by the recording folders temp-video.webm
  // read the items in video storage folder path

  try {
    const folders = await fs.promises.readdir(videoStoragePath);

    const allPromises = folders.map(async (folder) => {
      const folderPath = `${videoStoragePath}/${folder}/temp-video.webm`;
      const stats = await stat(folderPath);
      return stats.size;
    });

    const results = await Promise.allSettled(allPromises);

    const totalSize = results.reduce((acc, result) => {
      if (result.status === 'fulfilled') {
        return acc + result.value;
      }
      return acc;
    }, 0);

    return ipc.success(totalSize);
  } catch (err) {
    log.error('Failed to get recording memory usage', { err });
    return ipc.error('Failed to get recording memory usage', err);
  }
});

const appendChunkToFile = async (
  chunk: Uint8Array,
  recordingFolder: string,
) => {
  log.info('appending chunk to file');
  const buffer = Buffer.from(chunk);
  const videoPath = `${recordingFolder}/temp-video.webm`;

  await fs.promises.appendFile(videoPath, buffer);
  log.info('appending chunk completed');
};

ipcHandle('save-chunk', async (event, chunk) => {
  try {
    chunksWritten += 1;
    chunkQueue = chunkQueue.then(async () => {
      log.info(`Received Chunk-${chunksWritten}`);
      const recordingFolder = await getCurrentRecordingFolder();
      await appendChunkToFile(chunk, recordingFolder);
      log.info(`Saved Chunk-${chunksWritten} successfully`);
      return chunksWritten;
    });
    return ipc.success(undefined);
  } catch (err) {
    log.error('Failed to save chunk', { err });
    throw err;
  }
});

ipcHandle('close-overlay-window', async () => {
  // closeOverLayWindow();
  return ipc.success(undefined);
});

ipcHandle('media-recording-stopped', async () => {
  // closeAllHintWindows();
  return ipc.success(undefined);
});

ipcHandle('expand-overlay-window', async () => {
  // expandOverlayWindow();
  return ipc.success(undefined);
});

ipcHandle('shrink-overlay-window', async () => {
  // shrinkOverlayWindow();
  return ipc.success(undefined);
});
