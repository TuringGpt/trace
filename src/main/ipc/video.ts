import {
  app,
  desktopCapturer,
  DesktopCapturerSource,
  ipcMain,
  Menu,
} from 'electron';
import fs from 'fs';
import path from 'path';

import logger from '../util/logger';
import remuxVideo from '../util/remuxVideo';

const log = logger.child({ module: 'ipc.video' });
ipcMain.handle('get-video-sources', async (event) => {
  const sources = await desktopCapturer.getSources({ types: ['screen'] });
  try {
    const template = sources.map((item: DesktopCapturerSource) => ({
      label: item.name.length > 30 ? `${item.name.slice(0, 30)}...` : item.name,
      click: () => event.sender.send('select-source', item),
    }));
    Menu.buildFromTemplate(template).popup();
  } catch (e) {
    log.error('Failed to get video sources', e);
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
    log.info(`Video conversion took ${timeTakenToConvert / 1000} seconds.`);
    fs.unlinkSync(tempInputPath);
    return { videoFilePath: tempOutputPath };
  } catch (error) {
    log.error('Failed to remux the video file.', error);
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
