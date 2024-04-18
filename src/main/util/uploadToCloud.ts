import { v4 as uuidv4 } from 'uuid';

import { BlobServiceClient } from '@azure/storage-blob';

import { UploadResult } from '../../types/customTypes';
import logger from './logger';

const log = logger.child({ module: 'util.uploadToCloud' });

const blobUrl: string | undefined = process.env.BLOB_STORAGE_URL;
const uploadZipFile: (content: Buffer) => Promise<UploadResult> = async (
  content: Buffer,
) => {
  try {
    log.info('Uploading zip file...');
    if (!blobUrl) {
      throw new Error('Blob URL not found');
    }
    const blobServiceClient = process.env.NODE_ENV === 'development'
      ? BlobServiceClient.fromConnectionString(blobUrl)
      : new BlobServiceClient(blobUrl);
    const containerClient =
      blobServiceClient.getContainerClient('turing-videos');
    const blobName = `${uuidv4()}.zip`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.uploadData(content);
    return { uploadedZipFileName: blobName };
  } catch (err) {
    log.error('Failed to upload the zip file.', err);
    throw err;
  }
};
export default uploadZipFile;
