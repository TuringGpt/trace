import fs from 'fs';
import path from 'path';

import { ipc } from '../../types/customTypes';
import storage from '../storage';
import fileExists from '../util/fileExists';
import getDeviceMetadata from '../util/getMetaData';
import keylogger from '../util/keylogger';
import logger from '../util/logger';
import remuxVideo from '../util/remuxVideo';
import {
  getCurrentRecordingFolder,
  getVideoStoragePath,
  markRecordingStarted,
  markRecordingStopped,
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
    fs.unlinkSync(tempInputPath);
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

    // Check if a folder with the new name already exists in the filesystem
    let finalName = newName;
    const videoStoragePath = await getVideoStoragePath();
    let counter = 1;
    // eslint-disable-next-line no-await-in-loop
    while (await fileExists(path.join(videoStoragePath, finalName))) {
      finalName = `${newName}(${counter})`;
      counter += 1;
    }

    folder.folderName = finalName;
    await storage.save(db);

    // Rename the folder on disk
    const oldPath = path.join(getVideoStoragePath(), folderId);
    const newPath = path.join(getVideoStoragePath(), finalName);
    await fs.promises.rename(oldPath, newPath);

    return ipc.success(undefined);
  } catch (err) {
    log.error('Failed to rename recording', { err });
    return ipc.error('Failed to rename recording', err);
  }
});

ipcHandle('discard-recording', async (event, folderId) => {
  try {
    const db = await storage.getData();
    db.recordingFolders = db.recordingFolders.filter(
      (folder) => folder.id !== folderId,
    );
    await storage.save(db);

    // Delete the folder on disk
    const folderPath = `${getVideoStoragePath()}/${folderId}`;
    await fs.promises.rmdir(folderPath, { recursive: true });

    return ipc.success(undefined);
  } catch (err) {
    log.error('Failed to discard recording', { err });
    return ipc.error('Failed to discard recording', err);
  }
});
