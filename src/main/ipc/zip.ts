import archiver from 'archiver';
import { app, dialog } from 'electron';
import { once } from 'events';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import { ipc } from '../../types/customTypes';
import { getVideoStoragePath } from '../storage';
import logger from '../util/logger';
import { ipcHandle } from './typeSafeHandler';

const log = logger.child({ module: 'ipc.zip' });

ipcHandle(
  'create-zip-file',
  async (event, videoFilePath, keyLogFilePath, metadataFilePath) => {
    try {
      const zipFileName = `${uuidv4()}.zip`;
      const zipFilePath = `${getVideoStoragePath()}/${zipFileName}`;
      const output = fs.createWriteStream(zipFilePath);

      const archive = archiver('zip', { zlib: { level: 9 } });

      archive.pipe(output);
      archive.file(videoFilePath, { name: 'video.mp4' });
      if (keyLogFilePath) {
        archive.file(keyLogFilePath, { name: 'keylog.txt' });
      }
      if (metadataFilePath) {
        archive.file(metadataFilePath, { name: 'metadata.json' });
      }
      await archive.finalize();

      await once(output, 'close');
      log.info('Zip file created successfully.');

      fs.unlinkSync(videoFilePath);
      if (keyLogFilePath) {
        fs.unlinkSync(keyLogFilePath);
      }
      if (metadataFilePath) {
        fs.unlinkSync(metadataFilePath);
      }

      return ipc.success({
        zipFileName,
        zipFilePath,
      });
    } catch (error) {
      log.error('Failed to create zip file.', error);
      return ipc.error('Failed to create zip file.', error);
    }
  },
);

ipcHandle('save-zip-file', async (e, zipFileName, zipFilePath) => {
  try {
    log.info(`saving zipFileName: ${zipFileName}, zipFilePath: ${zipFilePath}`);
    const desktopPath = app.getPath('desktop'); // Get path to the Desktop
    const defaultDesktopPath = path.join(
      desktopPath,
      path.basename(zipFilePath),
    ); // Construct the default save path on the Desktop
    const filePath = await dialog.showSaveDialog({
      title: 'Save Recorded Video',
      defaultPath: defaultDesktopPath,
      filters: [{ name: zipFileName, extensions: ['zip'] }],
    });

    if (!filePath.canceled && filePath.filePath) {
      fs.renameSync(zipFilePath, filePath.filePath);
      log.info('Zip file saved successfully.');
      return ipc.success(filePath.filePath);
    }

    fs.unlinkSync(zipFilePath);
    log.warn('Zip file save operation cancelled.');
    return ipc.error('Zip file save operation cancelled.');
  } catch (error) {
    log.error('Failed to save the zip file.', error);
    return ipc.error('Failed to save the zip file.', error);
  }
});

ipcHandle('discard-zip-file', async (e, zipFilePath) => {
  try {
    if (fs.existsSync(zipFilePath)) {
      fs.unlinkSync(zipFilePath);
      log.info('Zip file discarded successfully.');
      return ipc.success(true);
    }
    log.warn('Cannot discard zip. Zip file does not exist.');
    return ipc.error('Cannot discard zip. Zip file does not exist.');
  } catch (error) {
    log.error('Failed to discard the zip file.', error);
    return ipc.error('Failed to discard the zip file.', error);
  }
});
