import { app, ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';

import logger from '../util/logger';
import uploadZipFile from '../util/uploadToCloud';

const log = logger.child({ module: 'ipc.upload' });

ipcMain.handle('upload-zip-file', async (e, zipFilePath: string) => {
  try {
    const content = fs.readFileSync(zipFilePath);
    const uploadResponse = await uploadZipFile(content);
    log.info(
      `Zip file uploaded successfully. File name - ${uploadResponse.uploadedZipFileName}`,
    );
    return uploadResponse;
  } catch (error) {
    log.error('Failed to upload the zip file.', error);
    return `ERROR: check logs at ${path.join(
      app.getPath('userData'),
      'app.log',
    )}`;
  }
});
