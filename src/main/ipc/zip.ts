import archiver from 'archiver';
import { app, dialog, ipcMain } from 'electron';
import { once } from 'events';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import logger, { logDirectory } from '../util/logger';

const log = logger.child({ module: 'ipc.zip' });

ipcMain.handle(
  'create-zip-file',
  async (event, videoFilePath, keyLogFilePath, metadataFilePath) => {
    try {
      const downloadsPath = app.getPath('downloads');
      const zipFileName = `${uuidv4()}.zip`;
      const zipFilePath = `${downloadsPath}/${zipFileName}`;
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

      return { zipFilePath, zipFileName };
    } catch (error) {
      log.error('Failed to create zip file.', error);
      return `ERROR: check logs at ${path.join(
        app.getPath('userData'),
        'app.log',
      )}`;
    }
  },
);

ipcMain.handle('save-zip-file', async (e, zipFileName, zipFilePath) => {
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
      return filePath.filePath;
    }

    fs.unlinkSync(zipFilePath);
    log.warn('Zip file save operation cancelled.');
    return null;
  } catch (error) {
    log.error('Failed to save the zip file.', error);
    return `ERROR: check logs at ${logDirectory}`;
  }
});

ipcMain.handle('discard-zip-file', async (e, zipFilePath) => {
  try {
    if (fs.existsSync(zipFilePath)) {
      fs.unlinkSync(zipFilePath);
      log.info('Zip file discarded successfully.');
      return true;
    }
    log.warn('Cannot discard zip. Zip file does not exist.');
    return false;
  } catch (error) {
    log.error('Failed to discard the zip file.', error);
    return `ERROR: check logs at ${logDirectory} `;
  }
});
