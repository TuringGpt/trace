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

  private async uploadFileResumable(
    filePath: string,
    signedUrl: string,
    folder: string,
    fileType: string,
    offset = 0,
  ): Promise<void> {
    const chunkSize = 1024 * 1024 * 5; // 5MB chunks
    const totalSize = (await stat(filePath)).size;

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

        // eslint-disable-next-line no-param-reassign
        offset += chunkSize;

        const percentComplete = Math.round((offset / totalSize) * 100);
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
        };
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

      log.info('Generating signed URLs', { folder });
      this.uploadStatusReport[folder] = { status: StatusTypes.Zipping };
      this.sendUploadProgress();

      if (!this.authToken) {
        throw new Error('Auth token is not set');
      }

      // Fetch signed URLs from backend
      let signedUrlsResponse;
      try {
        log.info(
          `Fetching Signed URLs ${BACKEND_URL}/signed-url ${this.authToken}`,
        );
        signedUrlsResponse = await axios.post(
          `${BACKEND_URL}/signed-url`,
          { folderName: folder },
          {
            headers: {
              Authorization: `Bearer ${this.authToken}`,
            },
          },
        );
        log.info('Signed URLs response received', {
          data: signedUrlsResponse.data,
        });
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

      if (signedUrlsResponse.status !== 200) {
        log.error('Failed to generate signed URLs', {
          status: signedUrlsResponse.status,
          data: signedUrlsResponse.data,
        });
        throw new Error('Failed to generate signed URLs');
      }

      const { signedUrls } = signedUrlsResponse.data;
      log.info('Signed URLs received', { signedUrls });

      // Upload files in resumable format
      const filesToUpload = [
        'keylog.txt',
        'metadata.json',
        'controls.json',
        'thumbnail.png',
        'video.mp4',
      ];
      filesToUpload.forEach(async (file) => {
        const filePath = join(videoStoragePath, folder, file);
        if (await fileExists(filePath)) {
          try {
            await this.uploadFileResumable(
              filePath,
              signedUrls[file],
              folder,
              file,
            );
          } catch (error: any) {
            log.error(
              `Failed to upload ${file} for folder ${folder}: ${error.message}`,
            );
            this.uploadStatusReport[folder] = { status: StatusTypes.Failed };
            this.sendUploadProgress();
            await markFolderUploadComplete(folder, false, ensureError(error));
            throw error;
          }
        } else {
          log.warn(`File not found, skipping upload: ${filePath}`);
        }
      });

      this.uploadStatusReport[folder] = { status: StatusTypes.Completed };
      this.sendUploadProgress();
      await markFolderUploadComplete(folder, true);
    } catch (err: any) {
      log.error('Failed to upload the folder.', {
        message: err.message,
        stack: err.stack,
        folder,
        response: err.response?.data,
      });
      this.uploadStatusReport[folder] = { status: StatusTypes.Failed };
      this.sendUploadProgress();
      await markFolderUploadComplete(folder, false, ensureError(err));
      throw err;
    }
  }
}

export default UploadManager;
