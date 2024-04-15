import { app, ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';

import logToFile from '../util/log';
import uploadZipFile from '../util/uploadToCloud';

ipcMain.handle('upload-zip-file', async (e, zipFilePath: string) => {
  try {
    const content = fs.readFileSync(zipFilePath);
    const uploadResponse = await uploadZipFile(content);
    logToFile(
      'SUCCESS',
      'UPLOAD',
      `Zip file uploaded successfully. File name - ${uploadResponse.uploadedZipFileName}`,
    );
    return uploadResponse;
  } catch (error) {
    logToFile('ERROR', 'UPLOAD', 'Failed to upload the zip file.', error);
    return `ERROR: check logs at ${path.join(
      app.getPath('userData'),
      'app.log',
    )}`;
  }
});
