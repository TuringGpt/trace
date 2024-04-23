import { app, DesktopCapturerSource } from 'electron';
import fs from 'fs';
// import { Low } from 'lowdb/lib/core/Low';
// import { JSONFilePreset } from 'lowdb/node';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import logger from './util/logger';

const log = logger.child({ module: 'storage' });

const fileName = 'application-state.json';

type RecordedFolder = {
  folderName: string;
  isUploaded: boolean;
  recordingStartedAt: number;
  recordingStoppedAt?: number;
  uploadingInProgress: boolean;
  uploadError?: string;
  uploadedAt?: number;
};

export type StorageApplicationState = {
  currentRecordingFolder?: RecordedFolder | null;
  isRecording: boolean;
  selectedDisplay?: DesktopCapturerSource;
  recordingFolders: Array<RecordedFolder>;
};
let db: {
  data: StorageApplicationState;
  write: () => Promise<void>;
  read: () => Promise<void>;
} = {
  data: {
    currentRecordingFolder: null,
    isRecording: false,
    recordingFolders: [],
  },
  write: async () => {
    log.info('Writing to file');
  },
  read: async () => {
    log.info('Reading from file');
  },
};

// (async () => {
//   db = await JSONFilePreset<StorageApplicationState>(fileName, {
//     currentRecordingFolder: null,
//     isRecording: false,
//     recordingFolders: [],
//   });
// })();

export function getVideoStoragePath(): string {
  const appDataPath = app.getPath('appData');
  const storagePath = path.join(appDataPath, 'video-storage');

  if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath);
  }

  return storagePath;
}

export async function setStorage<Key extends keyof StorageApplicationState>(
  key: Key,
  value: StorageApplicationState[Key],
) {
  db.data[key] = value;
  await db.write();
}

export async function markRecordingStarted() {
  try {
    const currentRecordingFolder = uuidv4();
    db.data.isRecording = true;
    db.data.currentRecordingFolder = {
      folderName: currentRecordingFolder,
      isUploaded: false,
      recordingStartedAt: Date.now(),
      uploadingInProgress: false,
    };
    await db.write();
    fs.mkdirSync(`${getVideoStoragePath()}/${currentRecordingFolder}`);
    return currentRecordingFolder;
  } catch (err) {
    logger.error('Failed to mark recording started.', err);
    throw err;
  }
}

export async function markRecordingStopped() {
  try {
    if (!db.data.currentRecordingFolder?.folderName) {
      throw new Error('No recording to stop');
    }
    db.data.isRecording = false;
    db.data.recordingFolders.push({
      ...db.data.currentRecordingFolder,
      folderName: db.data.currentRecordingFolder.folderName,
      recordingStoppedAt: Date.now(),
    });
    await db.write();
  } catch (err) {
    log.error('Failed to mark recording stopped.', err);
    throw err;
  }
}

export async function getCurrentRecordingFolder(): Promise<string> {
  await db.read();
  return `${getVideoStoragePath()}/${db.data.currentRecordingFolder}`;
}
