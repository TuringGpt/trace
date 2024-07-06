import { BrowserWindow } from 'electron';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import { join } from 'path';
import axios from 'axios';
import logger from './logger';
import { getAccessToken } from '../ipc/tokens';
import {
  UploadItemStatus,
  UploadStatusReport,
  StatusTypes,
} from '../../types/customTypes';
import {
  getVideoStoragePath,
  markFolderUploadComplete,
} from './storageHelpers';
import ensureError from '../../renderer/util/ensureError';
import fileExists from './fileExists';
import { BACKEND_URL } from '../../constants';
import storage from '../storage';

const log = logger.child({ module: 'util.UploadManager' });

class UploadManager {
  // eslint-disable-next-line no-use-before-define
  private static instance: UploadManager;

  public static mainWindowInstance: BrowserWindow;

  private blobUrl?: string;

  private gcsBucketUrl: string;

  private uploadStatusReport: UploadStatusReport = {};

  private authToken: string | null = null;

  private constructor() {
    log.info('Creating Upload Manager instance');
    this.blobUrl = process.env.BLOB_STORAGE_URL;
    this.gcsBucketUrl = 'trace-recordings';

    if (!this.blobUrl) {
      log.info('Blob URL not found, using GCS for upload');
    }

    log.info('Upload Manager instance created', {
      blobUrl: this.blobUrl,
      gcsBucketUrl: this.gcsBucketUrl,
    });
  }

  public static getInstance(): UploadManager {
    if (!UploadManager.instance) {
      UploadManager.instance = new UploadManager();
    }
    if (!UploadManager.instance.authToken) {
      UploadManager.instance.loadAuthToken();
    }
    return UploadManager.instance;
  }

  private async loadAuthToken() {
    try {
      this.authToken = await getAccessToken();
    } catch (error) {
      log.error('Error loading OAuth token from file:', error);
    }
  }

  public getStatusReport(): Record<string, UploadItemStatus> {
    return this.uploadStatusReport;
  }

  public async startUpload(folder: string): Promise<void> {
    log.info(`Starting upload for folder: ${folder}`);
    this.uploadStatusReport[folder] = { status: StatusTypes.Pending };
    await this.uploadFolder(folder);
  }

  private async sendUploadProgress(): Promise<void> {
    UploadManager.mainWindowInstance?.webContents.send('upload-progress', {
      status: this.getStatusReport(),
    });
  }

  public async updateOnDiscardComplete(folder: string): Promise<void> {
    delete this.uploadStatusReport[folder];
    this.sendUploadProgress();
  }

  private async fetchSignedUrls(
    folder: string,
  ): Promise<Record<string, string>> {
    if (!this.authToken) {
      throw new Error('Auth token is not set');
    }

    try {
      log.info(`Fetching Signed URLs from ${BACKEND_URL}/signed-url`);
      const response = await axios.post(
        `${BACKEND_URL}/signed-url`,
        { folderName: folder },
        {
          headers: {
            Authorization: `Bearer ${this.authToken}`,
          },
        },
      );

      if (response.status !== 200) {
        throw new Error(`Failed to generate signed URLs: ${response.status}`);
      }

      return response.data.signedUrls;
    } catch (error: any) {
      log.error('Error generating signed URLs', {
        message: error.message,
        stack: error.stack,
      });
      if (axios.isAxiosError(error) && error.response) {
        log.error('Response data:', { data: error.response.data });
      }
      throw new Error('Failed to generate signed URLs');
    }
  }

  private async uploadFileResumable(
    filePath: string,
    signedUrl: string,
    folder: string,
    fileType: string,
    initialOffset = 0,
  ): Promise<void> {
    const chunkSize = 1024 * 1024 * 10; // 10MB chunks
    const totalSize = (await stat(filePath)).size;
    let offset = initialOffset;

    let percentComplete = 0;
    while (offset < totalSize) {
      const start = offset;
      const end = Math.min(offset + chunkSize, totalSize) - 1;
      const chunk = createReadStream(filePath, { start, end });

      const headers = {
        'Content-Range': `bytes ${start}-${end}/${totalSize}`,
        'Content-Type': 'application/octet-stream',
      };

      try {
        // eslint-disable-next-line no-await-in-loop
        const response = await axios.put(signedUrl, chunk, {
          headers,
          timeout: 10000,
        });

        if (response.status !== 200 && response.status !== 201) {
          throw new Error(`Failed to upload ${fileType} chunk to GCS`);
        }

        // Update the offset correctly using end + 1 if the entire chunk is uploaded
        offset = end + 1;

        // Save the current offset to resume later if needed
        // eslint-disable-next-line no-await-in-loop
        await UploadManager.updateFileOffset(folder, fileType, offset);

        percentComplete = Math.round((offset / totalSize) * 100);
        log.debug('Resumable upload progress', {
          folder,
          fileType,
          progress: percentComplete,
        });
        this.uploadStatusReport[folder] = {
          status: StatusTypes.Uploading,
          progress: percentComplete,
        };
        this.sendUploadProgress();
      } catch (error: any) {
        chunk.destroy(); // Destroy the stream to free up resources
        this.uploadStatusReport[folder] = {
          status: StatusTypes.Failed,
          progress: percentComplete || 0,
        };
        log.error(
          `Upload Failed for folder '${folder}', ${percentComplete}% Completed`,
        );
        this.sendUploadProgress();
        throw new Error(
          `Failed to upload ${fileType} chunk to GCS: ${error.message}`,
        );
      }
    }
  }

  private async uploadFolder(folder: string): Promise<void> {
    try {
      log.info('Uploading folder', { folder });
      const videoStoragePath = getVideoStoragePath();
      const db = await storage.getData();
      const folderData = db.recordingFolders.find((f) => f.id === folder);

      if (!folderData) {
        throw new Error(`Folder data not found in DB for folder: ${folder}`);
      }

      log.info('Checking existing signed URLs', { folder });

      let signedUrls = folderData.uploadInfo?.signedUrls;
      const currentTime = Date.now();
      const signedUrlExpirationTime =
        folderData.uploadInfo?.signedUrlExpirationTime || 0;

      // Check if signed URLs are expired or not present
      if (!signedUrls || currentTime > signedUrlExpirationTime) {
        log.info('Signed URLs are expired or not present, fetching new ones', {
          folder,
        });
        signedUrls = await this.fetchSignedUrls(folder);
        // Save the new signed URLs and expiration time in the database
        if (!folderData.uploadInfo) {
          folderData.uploadInfo = {};
        }
        folderData.uploadInfo.signedUrls = signedUrls;
        folderData.uploadInfo.signedUrlExpirationTime =
          currentTime + 3600 * 1000;
        await storage.save(db);
      }

      log.info('Using signed URLs', { signedUrls });

      this.uploadStatusReport[folder] = {
        status: StatusTypes.FetchingUploadURLs,
      };
      this.sendUploadProgress();

      // Upload files in resumable format
      const filesToUpload = [
        'keylog.txt',
        'metadata.json',
        'controls.json',
        'thumbnail.png',
        'video.mp4',
      ];

      const uploadPromises = filesToUpload.map(async (file) => {
        const filePath = join(videoStoragePath, folder, file);
        if (await fileExists(filePath)) {
          try {
            const initialOffset = await UploadManager.getFileOffset(
              folder,
              file,
            );
            await this.uploadFileResumable(
              filePath,
              signedUrls[file],
              folder,
              file,
              initialOffset,
            );
          } catch (error: any) {
            log.error(
              `Failed to upload ${file} for folder ${folder}: ${error.message}`,
            );
            this.uploadStatusReport[folder] = {
              status: StatusTypes.Failed,
              progress: this.uploadStatusReport[folder]?.progress || 0,
            };
            this.sendUploadProgress();
            await markFolderUploadComplete(folder, false, ensureError(error));
            throw error;
          }
        } else {
          log.warn(`File not found, skipping upload: ${filePath}`);
        }
      });

      const results = await Promise.allSettled(uploadPromises);

      const allSucceeded = results.every(
        (result) => result.status === 'fulfilled',
      );

      if (allSucceeded) {
        this.uploadStatusReport[folder] = { status: StatusTypes.Uploaded };
        await markFolderUploadComplete(folder, true);
      } else {
        this.uploadStatusReport[folder] = {
          status: StatusTypes.Failed,
          progress: this.uploadStatusReport[folder]?.progress ?? 0,
        };
        await markFolderUploadComplete(
          folder,
          false,
          ensureError(new Error('Some files failed to upload')),
        );
      }

      this.sendUploadProgress();
    } catch (err: any) {
      log.error('Failed to upload the folder.', {
        message: err.message,
        stack: err.stack,
        folder,
        response: err.response?.data,
      });
      this.uploadStatusReport[folder] = {
        status: StatusTypes.Failed,
        progress: this.uploadStatusReport[folder]?.progress ?? 0,
      };
      this.sendUploadProgress();
      await markFolderUploadComplete(folder, false, ensureError(err));
      throw err;
    }
  }

  // Helper methods to manage file offsets
  private static async updateFileOffset(
    folder: string,
    file: string,
    offset: number,
  ) {
    const db = await storage.getData();
    const folderData = db.recordingFolders.find((f) => f.id === folder);

    if (folderData) {
      if (!folderData.uploadInfo) {
        folderData.uploadInfo = {};
      }
      if (!folderData.uploadInfo.fileOffsets) {
        folderData.uploadInfo.fileOffsets = {};
      }
      folderData.uploadInfo.fileOffsets[file] = offset;
      await storage.save(db);
    }
  }

  private static async getFileOffset(
    folder: string,
    file: string,
  ): Promise<number> {
    const db = await storage.getData();
    const folderData = db.recordingFolders.find((f) => f.id === folder);

    if (
      folderData?.uploadInfo?.fileOffsets &&
      folderData.uploadInfo.fileOffsets[file]
    ) {
      return folderData.uploadInfo.fileOffsets[file];
    }

    return 0;
  }
}

export default UploadManager;
