import archiver from 'archiver';
import { ipcMain } from 'electron';
import { once } from 'events';
import { createWriteStream } from 'fs';
import { stat } from 'fs/promises';
import { join } from 'path';

import { BlobServiceClient } from '@azure/storage-blob';

import ensureError from '../../renderer/util/ensureError';
import logger from './logger';
import {
  getVideoStoragePath,
  markFolderUploadComplete,
  markFolderUploadStart,
} from './storageHelpers';

const log = logger.child({ module: 'util.UploadManager' });

export enum StatusTypes {
  Pending,
  Zipping,
  Uploading,
  Completed,
  Failed,
}

export type UploadItemStatus =
  | {
      status: Exclude<StatusTypes, StatusTypes.Uploading>;
    }
  | {
      status: StatusTypes.Uploading;
      progress: number;
    };

class UploadManager {
  // eslint-disable-next-line no-use-before-define
  private static instance: UploadManager;

  private queue: string[] = [];

  private isUploading = false;

  private blobUrl: string;

  private uploadStatusReport: Record<string, UploadItemStatus> = {};

  private constructor() {
    log.info('Creating Upload Manager instance');
    if (!process.env.BLOB_STORAGE_URL) {
      log.error('Cannot initialize Upload Manger. Blob URL not found', {
        blobUrl: process.env.BLOB_STORAGE_URL,
      });
      throw new Error('Cannot initialize Upload Manger. Blob URL not found');
    }
    this.blobUrl = process.env.BLOB_STORAGE_URL;
    log.info('Upload Manager instance created', {
      blobUrl: this.blobUrl,
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

  public addToQueue(folder: string): void {
    this.queue.push(folder);
    this.uploadStatusReport[folder] = { status: StatusTypes.Pending };
  }

  public async start(): Promise<void> {
    if (this.isUploading) {
      return;
    }
    this.isUploading = true;
    log.info('Starting upload process queue');
    await this.processQueue();
  }

  public stop(): void {
    this.isUploading = false;
  }

  private async processQueue(): Promise<void> {
    while (this.queue.length > 0 && this.isUploading) {
      const folder = this.queue.shift();
      if (folder) {
        // eslint-disable-next-line no-await-in-loop
        await this.uploadFolder(folder);
      }
    }
    this.isUploading = false;
  }

  private async uploadFolder(folder: string): Promise<void> {
    try {
      log.info('Uploading folder', { folder });
      const videoStoragePath = getVideoStoragePath();

      log.info('Zipping folder', { folder });
      this.uploadStatusReport[folder] = { status: StatusTypes.Zipping };
      // TODO: Verify if the zip file already exists, handle it
      const blobName = `zipped.zip`;
      const zipPath = join(videoStoragePath, folder, blobName);
      const archive = archiver('zip', { zlib: { level: 9 } });
      const output = createWriteStream(zipPath);

      archive.pipe(output);
      archive.file(join(videoStoragePath, folder, 'video.mp4'), {
        name: 'video.mp4',
      });
      archive.file(join(videoStoragePath, folder, 'keylog.txt'), {
        name: 'keylog.txt',
      });
      archive.file(join(videoStoragePath, folder, 'metadata.json'), {
        name: 'metadata.json',
      });

      await archive.finalize();

      await once(output, 'close');
      log.info('Writing zip successful. Wrote %d bytes', output.bytesWritten);

      this.uploadStatusReport[folder] = {
        status: StatusTypes.Uploading,
        progress: 0,
      };
      const totalBytes = (await stat(zipPath)).size;

      const blobServiceClient = BlobServiceClient.fromConnectionString(
        this.blobUrl,
      );
      const containerClient =
        blobServiceClient.getContainerClient('turing-videos');
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      log.info('Uploading zip file...', { zipPath });
      await markFolderUploadStart(folder);
      await blockBlobClient.uploadFile(zipPath, {
        onProgress: (progress) => {
          const percentComplete = Math.round(
            (progress.loadedBytes / totalBytes) * 100,
          );
          log.info('Upload progress', { progress, percentComplete });
          this.uploadStatusReport[folder] = {
            status: StatusTypes.Uploading,
            progress: percentComplete,
          };
          ipcMain.emit('upload-progress', {
            folder,
            progress: percentComplete,
          });
        },
      });
      log.info('Uploaded zip file', { zipPath });
      await markFolderUploadComplete(folder, true);
      this.uploadStatusReport[folder] = { status: StatusTypes.Completed };
    } catch (err) {
      log.error('Failed to upload the zip file.', { err, folder });
      this.uploadStatusReport[folder] = { status: StatusTypes.Failed };
      await markFolderUploadComplete(folder, false, ensureError(err));
      throw err;
    }
  }
}

export default UploadManager;
