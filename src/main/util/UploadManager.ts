import { BrowserWindow } from 'electron';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import { join } from 'path';
import { request } from 'https';
import axios from 'axios';
import logger from './logger';
import {
  UploadItemStatus,
  UploadStatusReport,
  StatusTypes,
} from '../../types/customTypes';
import {
  getTokens,
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
    return UploadManager.instance;
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

  private async fetchResumableSessionUris(
    folderName: string,
  ): Promise<Record<string, string>> {
    if (!this.authToken) {
      const tokens = await getTokens();
      if (!tokens) throw new Error('Auth token is not set');
      this.authToken = tokens.accessToken;
    }

    try {
      log.info(
        `Fetching Resumable Session URIs from ${BACKEND_URL}/session-uri`,
      );
      const response = await axios.post(
        `${BACKEND_URL}/session-uri`,
        { folderName },
        {
          headers: {
            Authorization: `Bearer ${this.authToken}`,
          },
        },
      );

      if (response.status !== 200) {
        throw new Error(
          `Failed to generate resumable session URIs: ${response.status}`,
        );
      }

      return response.data.sessionUris;
    } catch (error: any) {
      log.error('Error generating resumable session URIs', {
        message: error.message,
        stack: error.stack,
      });
      if (axios.isAxiosError(error) && error.response) {
        log.error('Response data:', { data: error.response.data });
      }
      throw new Error('Failed to generate resumable session URIs');
    }
  }

  private async uploadFileResumable(
    filePath: string,
    sessionUri: string,
    folder: string,
    fileType: string,
  ): Promise<void> {
    const totalSize = (await stat(filePath)).size;
    const fileStream = createReadStream(filePath);

    const headers = {
      'Content-Type': UploadManager.getContentType(fileType),
      'Content-Length': totalSize,
    };

    return new Promise<void>((resolve, reject) => {
      const url = new URL(sessionUri);

      const req = request(
        {
          method: 'PUT',
          hostname: url.hostname,
          port: url.port,
          path: url.pathname + url.search,
          headers,
        },
        (res) => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            log.debug('Resumable upload progress', {
              folder,
              fileType,
              progress: 100,
            });
            this.uploadStatusReport[folder] = {
              status: StatusTypes.Uploading,
              progress: 100,
            };
            this.sendUploadProgress();
            resolve();
          } else {
            log.error(`Failed to upload ${fileType} to GCS`, {
              statusCode: res.statusCode,
              statusMessage: res.statusMessage,
            });
            reject(new Error(`Failed to upload ${fileType} to GCS`));
          }
        },
      );

      req.on('error', (err) => {
        log.error(`Upload Failed for folder '${folder}', 0% Completed`, {
          message: err.message,
          stack: err.stack,
        });
        this.uploadStatusReport[folder] = {
          status: StatusTypes.Failed,
          progress: 0,
        };
        this.sendUploadProgress();
        reject(
          new Error(`Failed to upload ${fileType} to GCS: ${err.message}`),
        );
      });

      fileStream.pipe(req);
    });
  }

  private static getContentType(fileName: string): string {
    const contentTypeMapping: { [key: string]: string } = {
      txt: 'text/plain',
      json: 'application/json',
      webm: 'video/webm',
      mp4: 'video/mp4',
      png: 'image/png',
    };
    const fileExtension = fileName.split('.').pop() || '';
    return contentTypeMapping[fileExtension] || 'application/octet-stream';
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

      this.uploadStatusReport[folder] = {
        status: StatusTypes.FetchingUploadURLs,
      };
      this.sendUploadProgress();

      const sessionUris = await this.fetchResumableSessionUris(folder);

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
            await this.uploadFileResumable(
              filePath,
              sessionUris[file],
              folder,
              file,
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
}

export default UploadManager;
