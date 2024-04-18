import fs from 'fs';

import { ipc } from '../../types/customTypes';
import logger from '../util/logger';
import uploadZipFile from '../util/uploadToCloud';
import { ipcHandle } from './typeSafeHandler';

const log = logger.child({ module: 'ipc.upload' });

ipcHandle('upload-zip-file', async (e, zipFilePath: string) => {
  try {
    const content = fs.readFileSync(zipFilePath);
    const uploadResponse = await uploadZipFile(content);
    log.info(
      `Zip file uploaded successfully. File name - ${uploadResponse.uploadedZipFileName}`,
    );
    return ipc.success(uploadResponse);
  } catch (error) {
    log.error('Failed to upload the zip file.', error);
    return ipc.error('Failed to upload the zip file.', error);
  }
});
