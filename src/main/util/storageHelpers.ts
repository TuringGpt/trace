import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import storage from '../storage';
import logger from './logger';

const log = logger.child({ module: 'util.storageHelpers' });
export function getVideoStoragePath(): string {
  const appDataPath = app.getPath('userData');
  const storagePath = path.join(appDataPath, 'video-storage');

  if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath);
  }

  return storagePath;
}

export async function markRecordingStarted() {
  try {
    const currentRecordingFolder = uuidv4();
    const db = await storage.getData();
    db.isRecording = true;
    db.currentRecordingFolder = {
      folderName: currentRecordingFolder,
      id: currentRecordingFolder,
      isUploaded: false,
      recordingStartedAt: Date.now(),
      uploadingInProgress: false,
    };
    await storage.save(db);
    fs.mkdirSync(`${getVideoStoragePath()}/${currentRecordingFolder}`);
    log.info('Created new recording folder.', {
      path: `${getVideoStoragePath()}/${currentRecordingFolder}`,
    });
    return currentRecordingFolder;
  } catch (err) {
    logger.error('Failed to mark recording started.', err);
    throw err;
  }
}

export async function markRecordingStopped() {
  try {
    const data = await storage.getData();
    if (!data.currentRecordingFolder?.folderName) {
      throw new Error('No recording to stop');
    }
    data.isRecording = false;
    data.recordingFolders.push({
      ...data.currentRecordingFolder,
      folderName: data.currentRecordingFolder.folderName,
      recordingStoppedAt: Date.now(),
    });
    await storage.save(data);
  } catch (err) {
    log.error('Failed to mark recording stopped.', err);
    throw err;
  }
}

export async function getCurrentRecordingFolder(): Promise<string> {
  const data = await storage.getData();
  return `${getVideoStoragePath()}/${data.currentRecordingFolder?.folderName}`;
}
