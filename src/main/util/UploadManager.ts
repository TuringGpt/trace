import archiver from 'archiver';
import { BrowserWindow } from 'electron';
import { once } from 'events';
import { createReadStream, createWriteStream } from 'fs';
import { stat, unlink } from 'fs/promises';
import { join } from 'path';

import { BlobServiceClient } from '@azure/storage-blob';

import axios from 'axios';
import ensureError from '../../renderer/util/ensureError';
import {
  StatusTypes,
  UploadItemStatus,
  UploadStatusReport,
} from '../../types/customTypes';
import fileExists from './fileExists';
import logger from './logger';
import {
  getThumbnailPath,
  getVideoStoragePath,
  markFolderUploadComplete,
  markFolderUploadStart,
} from './storageHelpers';

const log = logger.child({ module: 'util.UploadManager' });

class UploadManager {
  // eslint-disable-next-line no-use-before-define
  private static instance: UploadManager;

  public static mainWindowInstance: BrowserWindow;

  private queue: string[] = [];

  private isUploading = false;

  private blobUrl?: string;

  private gcsBucketUrl: string;

  private uploadStatusReport: UploadStatusReport = {};

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

  public addToQueue(folder: string): void {
    if (this.queue.length === 0) {
      // Start of a new upload batch, clear the status report
      this.uploadStatusReport = {};
    }
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

  private async sendUploadProgress(): Promise<void> {
    UploadManager.mainWindowInstance?.webContents.send('upload-progress', {
      status: this.getStatusReport(),
    });
  }

  /**
   *
   * on discard complete, remove the folder from the status report
   * and send the updated status report to the renderer
   * this also forces the renderer to get the recording folders state again
   * so we can hack into this to force a refresh of the recording folders
   * this is debounced in the renderer so fell free to call this multiple times
   */
  public async updateOnDiscardComplete(folder: string): Promise<void> {
    delete this.uploadStatusReport[folder];
    this.sendUploadProgress();
  }

  private async uploadFolder(folder: string): Promise<void> {
    try {
      log.info('Uploading folder', { folder });
      const videoStoragePath = getVideoStoragePath();

      log.info('Zipping folder', { folder });
      this.uploadStatusReport[folder] = { status: StatusTypes.Zipping };
      this.sendUploadProgress();
      const blobName = `${folder}.zip`;
      const zipPath = join(videoStoragePath, folder, blobName);

      if (await fileExists(zipPath)) {
        await unlink(zipPath);
      }

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
      archive.file(join(videoStoragePath, folder, 'controls.json'), {
        name: 'controls.json',
      });

      // check if there is a thumbnail file and add it if it exists
      const thumbnailPath = join(getThumbnailPath(), `${folder}.png`);
      if (await fileExists(thumbnailPath)) {
        archive.file(thumbnailPath, { name: 'thumbnail.png' });
      } else {
        log.error('Could not find thumbnail to upload', { thumbnailPath });
      }

      await archive.finalize();

      await once(output, 'close');
      log.info('Writing zip successful. Wrote %d bytes', output.bytesWritten);

      this.uploadStatusReport[folder] = {
        status: StatusTypes.Uploading,
        progress: 0,
      };
      this.sendUploadProgress();
      const totalBytes = (await stat(zipPath)).size;

      if (this.blobUrl) {
        // Azure Blob Storage upload
        const blobServiceClient = BlobServiceClient.fromConnectionString(
          this.blobUrl,
        );
        const containerClient =
          blobServiceClient.getContainerClient('turing-videos');
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        log.info('Uploading zip file to Azure Blob Storage...', { zipPath });
        await markFolderUploadStart(folder);
        await blockBlobClient.uploadFile(zipPath, {
          onProgress: (progress) => {
            if (
              this.uploadStatusReport[folder].status ===
                StatusTypes.Completed ||
              this.uploadStatusReport[folder].status === StatusTypes.Failed
            ) {
              log.info(
                'Upload already completed or failed. Stopping upload progress',
              );
              return;
            }
            const percentComplete = Math.round(
              (progress.loadedBytes / totalBytes) * 100,
            );
            log.debug('Upload progress', { folder, progress, percentComplete });
            this.uploadStatusReport[folder] = {
              status: StatusTypes.Uploading,
              progress: percentComplete,
            };
            this.sendUploadProgress();
          },
        });
        log.info('Uploaded zip file to Azure Blob Storage', { zipPath });
      } else {
        // GCS upload
        log.info('Uploading zip file to GCS...', { zipPath });
        await markFolderUploadStart(folder);

        const readStream = createReadStream(zipPath);
        const uploadUrl = `https://storage.googleapis.com/trace-recordings/${folder}.zip`;

        const response = await axios.put(uploadUrl, readStream, {
          headers: {
            'Content-Type': 'application/zip',
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        });

        if (response.status === 200) {
          log.info('Uploaded zip file to GCS', { zipPath });
          await markFolderUploadComplete(folder, true);
          this.uploadStatusReport[folder] = { status: StatusTypes.Completed };
          this.sendUploadProgress();
        } else {
          throw new Error('Failed to upload zip file to GCS');
        }
      }
      await markFolderUploadComplete(folder, true);
      this.uploadStatusReport[folder] = { status: StatusTypes.Completed };
      this.sendUploadProgress();
    } catch (err) {
      log.error('Failed to upload the zip file.', { err, folder });
      this.uploadStatusReport[folder] = { status: StatusTypes.Failed };
      this.sendUploadProgress();
      await markFolderUploadComplete(folder, false, ensureError(err));
      throw err;
    }
  }
}

export default UploadManager;
