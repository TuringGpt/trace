import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import * as uuid from 'short-uuid';
import storage from '../storage';
import logger from './logger';
import getVideoStoragePath from './videoStorage';

const log = logger.child({ module: 'util.storageHelpers' });

export function getThumbnailPath(): string {
  const appDataPath = app.getPath('userData');
  const thumbnailPath = path.join(appDataPath, 'thumbnails');

  if (!fs.existsSync(thumbnailPath)) {
    fs.mkdirSync(thumbnailPath);
  }
  return thumbnailPath;
}

export async function markRecordingStarted() {
  try {
    const currentRecordingFolder = uuid.generate();
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
    logger.error('Failed to mark recording started.', { err });
    throw err;
  }
}

export async function markFolderUploadStart(folderId: string) {
  try {
    const db = await storage.getData();
    const folder = db.recordingFolders.find((f) => f.id === folderId);
    if (!folder) {
      throw new Error('Folder not found');
    }
    folder.uploadingInProgress = true;
    await storage.save(db);
  } catch (err) {
    log.error('Failed to mark folder upload started.', {
      err,
      folderId,
    });
    throw err;
  }
}

export async function storeRecordingSize(folderId: string, size: number) {
  try {
    const db = await storage.getData();
    const folder = db.recordingFolders.find((f) => f.id === folderId);
    if (!folder) {
      throw new Error('Folder not found');
    }
    folder.recordingSize = size;
    await storage.save(db);
  } catch (err) {
    log.error('Failed to store recording size.', {
      err,
      folderId,
    });
    throw err;
  }
}

export async function markFolderUploadComplete(
  folderId: string,
  isSuccess: boolean,
  error?: Error,
) {
  try {
    const db = await storage.getData();
    const folder = db.recordingFolders.find((f) => f.id === folderId);
    if (!folder) {
      throw new Error('Folder not found');
    }
    folder.uploadingInProgress = false;
    folder.isUploaded = isSuccess;
    if (error) {
      folder.uploadError = error.message;
    } else {
      folder.uploadError = undefined;
      folder.uploadedAt = Date.now();
    }
    await storage.save(db);
  } catch (err) {
    log.error('Failed to mark folder upload complete.', {
      err,
      folderId,
    });
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

export async function saveVideoDuration(folderId: string, duration: number) {
  try {
    const db = await storage.getData();
    const folder = db.recordingFolders.find((f) => f.id === folderId);
    if (!folder) {
      throw new Error('Folder not found');
    }
    folder.recordingDuration = duration;
    log.debug('Saved video duration.', {
      folderId,
      duration,
    });
    await storage.save(db);
  } catch (err) {
    log.error('Failed to save video duration.', {
      err,
      folderId,
    });
    throw err;
  }
}

export async function setTokens(accessToken: string, refreshToken?: string) {
  try {
    const db = await storage.getData();
    db.tokens = {
      accessToken: accessToken || db.tokens?.accessToken,
      refreshToken: refreshToken || db.tokens?.refreshToken,
    };
    await storage.save(db);
  } catch (err) {
    log.error('Failed to set tokens.', { err });
    throw err;
  }
}

export async function getTokens() {
  try {
    const db = await storage.getData();
    return db.tokens;
  } catch (err) {
    log.error('Failed to get tokens.', { err });
    throw err;
  }
}

export async function removeTokens() {
  try {
    const db = await storage.getData();
    db.tokens = undefined;
    await storage.save(db);
  } catch (err) {
    log.error('Failed to get tokens.', { err });
    throw err;
  }
}

export async function setSessionUris(
  folderId: string,
  sessionUris: Record<string, string>,
  expirationTime: number,
) {
  try {
    const db = await storage.getData();
    const folder = db.recordingFolders.find((f) => f.id === folderId);
    if (!folder) {
      throw new Error('Folder not found');
    }
    folder.uploadInfo = {
      sessionUris,
      sessionUrisExpirationTime: expirationTime,
    };
    await storage.save(db);
  } catch (err) {
    log.error('Failed to set session URIs.', {
      err,
      folderId,
    });
    throw err;
  }
}

export async function getSessionUris(
  folderId: string,
): Promise<{ sessionUris?: Record<string, string>; expirationTime?: number }> {
  try {
    const db = await storage.getData();
    const folder = db.recordingFolders.find((f) => f.id === folderId);
    if (!folder) {
      throw new Error('Folder not found');
    }
    return {
      sessionUris: folder.uploadInfo?.sessionUris,
      expirationTime: folder.uploadInfo?.sessionUrisExpirationTime,
    };
  } catch (err) {
    log.error('Failed to get session URIs.', {
      err,
      folderId,
    });
    throw err;
  }
}
