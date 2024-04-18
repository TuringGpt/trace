import { v4 as uuidv4 } from 'uuid';

import { BlobServiceClient } from '@azure/storage-blob';

import { UploadResult } from '../../types/customTypes';
import logger from './logger';

const log = logger.child({ module: 'util.uploadToCloud' });

const isDemo = process.env.MODE === 'demo';
// TODO: Revisit this, this is copied over logic, we should be relying on the NODE_ENV variable instead
const isDev = !isDemo && process.env.MODE !== 'production';

const blobUrl: string | undefined = process.env.BLOB_STORAGE_URL;
const uploadZipFile: (content: Buffer) => Promise<UploadResult> = async (
  content: Buffer,
) => {
if (isDemo)
    return new Promise((resolve) => {
      setTimeout(
        () =>
          resolve({
            uploadedZipFileName: 'sample-file.zip',
          }),
        3000,
      );
    });
  try {
    log.info('Uploading zip file...');
    if (!blobUrl) {
      throw new Error('Blob URL not found');
    }
    const blobServiceClient = isDev
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
