// handle all inter process communication

import archiver from 'archiver';
import {
  app,
  desktopCapturer,
  DesktopCapturerSource,
  dialog,
  ipcMain,
  Menu,
} from 'electron';
import { once } from 'events';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import remuxVideo from './remuxUtils';
import { logToFile } from './util';

ipcMain.handle('get-video-sources', async (event) => {
  const sources = await desktopCapturer.getSources({ types: ['screen'] });
  try {
    const template = sources.map((item: DesktopCapturerSource) => ({
      label: item.name.length > 30 ? `${item.name.slice(0, 30)}...` : item.name,
      click: () => event.sender.send('select-source', item),
    }));
    Menu.buildFromTemplate(template).popup();
  } catch (e) {
    logToFile('ERROR', 'GET_VIDEO_SOURCES', 'Failed to get video sources', e);
    throw e;
  }
  return sources;
});

ipcMain.handle('remux-video-file', async (event, uint8Array) => {
  let tempInputPath = '';
  let tempOutputPath = '';
  try {
    const buffer = Buffer.from(uint8Array);
    const downloadsPath = app.getPath('downloads');
    tempInputPath = `${downloadsPath}/temp-input-${Date.now()}-video.webm`;
    tempOutputPath = `${downloadsPath}/${Date.now()}-video.mp4`;
    fs.writeFileSync(tempInputPath, buffer);

    const startTime = Date.now();
    await remuxVideo(tempInputPath, tempOutputPath);
    const timeTakenToConvert = Date.now() - startTime;
    logToFile(
      'SUCCESS',
      'VIDEO_REMUXING',
      `Video conversion took ${timeTakenToConvert / 1000} seconds.`,
    );
    fs.unlinkSync(tempInputPath);
    return { videoFilePath: tempOutputPath };
  } catch (error) {
    logToFile(
      'ERROR',
      'VIDEO_REMUXING',
      'Failed to remux the video file.',
      error,
    );
    if (fs.existsSync(tempInputPath)) {
      fs.unlinkSync(tempInputPath);
    }
    if (fs.existsSync(tempOutputPath)) {
      fs.unlinkSync(tempOutputPath);
    }
    return `ERROR: check logs at ${path.join(
      app.getPath('userData'),
      'app.log',
    )}`;
  }
});

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
      // archive.file(keyLogFilePath, { name: 'keylog.txt' });
      // archive.file(metadataFilePath, { name: 'metadata.json' });
      await archive.finalize();

      await once(output, 'close');
      logToFile('SUCCESS', 'ZIP_CREATION', 'Zip file created successfully.');

      fs.unlinkSync(videoFilePath);
      // fs.unlinkSync(metadataFilePath);
      // fs.unlinkSync(keyLogFilePath);

      return { zipFilePath, zipFileName };
    } catch (error) {
      logToFile('ERROR', 'ZIP_CREATION', 'Failed to create zip file.', error);
      return `ERROR: check logs at ${path.join(
        app.getPath('userData'),
        'app.log',
      )}`;
    }
  },
);

ipcMain.handle('save-zip-file', async (e, zipFileName, zipFilePath) => {
  try {
    logToFile(
      'INFO',
      'ZIP_FILE_SAVE',
      `zipFileName: ${zipFileName}, zipFilePath: ${zipFilePath}`,
    );
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
      logToFile('INFO', 'ZIP_FILE_SAVE', 'Zip file saved successfully.');
      return filePath.filePath;
    }

    fs.unlinkSync(zipFilePath);
    logToFile('WARN', 'ZIP_FILE_SAVE', 'Zip file save operation cancelled.');
    return null;
  } catch (error) {
    logToFile('ERROR', 'ZIP_FILE_SAVE', 'Failed to save the zip file.', error);
    return `ERROR: check logs at ${path.join(
      app.getPath('userData'),
      'app.log',
    )}`;
  }
});
