import fs from 'fs';
import { readFile, rmdir, stat, unlink } from 'fs/promises';

import { ipc } from '../../types/customTypes';
import storage from '../storage';
import getDeviceMetadata from '../util/getMetaData';
import keylogger from '../util/keylogger';
import logger from '../util/logger';
import remuxVideo from '../util/remuxVideo';
import {
  getCurrentRecordingFolder,
  getVideoStoragePath,
  markRecordingStarted,
  markRecordingStopped,
  storeRecordingSize,
} from '../util/storageHelpers';
import { ipcHandle } from './typeSafeHandler';

const log = logger.child({ module: 'ipc.record' });

ipcHandle('start-new-recording', async () => {
  log.info('Recording started');
  await markRecordingStarted();
  keylogger.startLogging();
  log.info('Keystrokes logging started');
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

async function writeVideoToFile(video: Uint8Array, recordingFolder: string) {
  let tempInputPath = '';
  let tempOutputPath = '';
  try {
    const buffer = Buffer.from(video);

    tempInputPath = `${recordingFolder}/temp-video.webm`;
    tempOutputPath = `${recordingFolder}/video.mp4`;
    await fs.promises.writeFile(tempInputPath, buffer);
    log.info('Video file written to disk for remuxing.', {
      tempInputPath,
      tempOutputPath,
    });

    const startTime = Date.now();
    await remuxVideo(tempInputPath, tempOutputPath);
    const timeTakenToConvert = Date.now() - startTime;
    log.info(`Video conversion took ${timeTakenToConvert / 1000} seconds.`);
    await unlink(tempInputPath);

    // Store the video file size in the database
    const folderId = recordingFolder.split('/').pop();
    const videoStats = await stat(tempOutputPath);

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
    if (fs.existsSync(tempInputPath)) {
      fs.unlinkSync(tempInputPath);
    }
    if (fs.existsSync(tempOutputPath)) {
      fs.unlinkSync(tempOutputPath);
    }
    throw error;
  }
}

ipcHandle('stop-recording', async (event, uint8Array) => {
  try {
    const recordingFolder = await getCurrentRecordingFolder();
    const db = await storage.getData();
    const logContent = keylogger.stopLogging();
    const metadata = await getDeviceMetadata();
    await markRecordingStopped();

    log.info('Recording stopped');

    await writeKeylogToFile(logContent, recordingFolder);

    await writeMetadataToFile(JSON.stringify(metadata), recordingFolder);

    await writeVideoToFile(uint8Array, recordingFolder);

    return ipc.success({
      recordingFolderName: db.currentRecordingFolder!.folderName,
    });
  } catch (err) {
    log.error('Failed during stop recording', { err });
    return ipc.error('Error while saving the log', err);
  }
});

ipcHandle('rename-recording', async (event, folderId, newName, description) => {
  try {
    const db = await storage.getData();
    const folder = db.recordingFolders.find((f) => f.id === folderId);
    if (!folder) {
      throw new Error('Folder not found');
    }
    folder.description = description;

    folder.folderName = newName.trim();
    await storage.save(db);

    return ipc.success(undefined);
  } catch (err) {
    log.error('Failed to rename recording', { err });
    return ipc.error('Failed to rename recording', err);
  }
});

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
    await rmdir(folderPath, { recursive: true });

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
      rmdir(`${getVideoStoragePath()}/${folderId}`, {
        recursive: true,
      }),
    );

    const results = await Promise.allSettled(deletePromises);

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        log.error(`Failed to delete folder ${folderIds[index]}`, {
          error: result.reason,
        });
      }
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

ipcHandle('clean-up-from-local', async (event, folderId) => {
  try {
    const db = await storage.getData();
    const folder = db.recordingFolders.find((f) => f.id === folderId);
    if (!folder) {
      log.error('Folder not found', { folderId });
    } else {
      folder.isDeletedFromLocal = true;
      await storage.save(db);
    }

    // Delete the folder on disk
    const folderPath = `${getVideoStoragePath()}/${folderId}`;
    // Check if the folder is already deleted from local
    if (!fs.existsSync(folderPath)) {
      log.info('Folder already deleted from local', { folderId });
      return ipc.success(undefined);
    }

    await rmdir(folderPath, { recursive: true });

    return ipc.success(undefined);
  } catch (err) {
    log.error('Failed to clean up from local', { err });
    return ipc.error('Failed to clean up from local', err);
  }
});

ipcHandle('get-recording-memory-usage', async () => {
  const videoStoragePath = getVideoStoragePath();
  // get the memory occupied by the recording folders video.mp4
  // read the items in video storage folder path

  try {
    const folders = await fs.promises.readdir(videoStoragePath);

    const allPromises = folders.map(async (folder) => {
      const folderPath = `${videoStoragePath}/${folder}`;
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
