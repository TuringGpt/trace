import { app, desktopCapturer, DesktopCapturerSource, Menu } from 'electron';
import fs from 'fs';

import { ipc } from '../../types/customTypes';
import logger from '../util/logger';
import remuxVideo from '../util/remuxVideo';
import {ipcHandle, ipcMainOn} from './typeSafeHandler';

const log = logger.child({ module: 'ipc.video' });
ipcHandle('get-video-sources', async (event) => {
  const sources = await desktopCapturer.getSources({ types: ['screen'] });
  try {
    const template = sources.map((item: DesktopCapturerSource) => ({
      label: item.name.length > 30 ? `${item.name.slice(0, 30)}...` : item.name,
      click: () => event.sender.send('select-source', item),
    }));
    Menu.buildFromTemplate(template).popup();
  } catch (e) {
    log.error('Failed to get video sources', e);
    return ipc.error('Failed to get video sources', e);
  }
  return ipc.success(undefined);
});

ipcHandle('remux-video-file', async (event, uint8Array) => {
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
    return ipc.success({ videoFilePath: tempOutputPath });
  } catch (error) {
    log.error('Failed to remux the video file.', error);
    if (fs.existsSync(tempInputPath)) {
      fs.unlinkSync(tempInputPath);
    }
    if (fs.existsSync(tempOutputPath)) {
      fs.unlinkSync(tempOutputPath);
    }
    return ipc.error('Failed to remux the video file.', error);
  }
});

const recordedChunks = []
ipcMainOn('store-chunk', (event, uint8Array) => {
  recordedChunks.push(uint8Array)
})

ipcHandle('remux-stored-chunks', async (event) => {
  let tempInputPath = '';
  let tempOutputPath = '';
  try {
    let bufferArray = recordedChunks.map(Buffer.from)
    let buffer = Buffer.concat(bufferArray)
    const downloadsPath = app.getPath('downloads');
    tempInputPath = `${downloadsPath}/temp-input-from-stream-${Date.now()}-video.webm`;
    tempOutputPath = `${downloadsPath}/${Date.now()}-from-stream-video.mp4`;
    fs.writeFileSync(tempInputPath, buffer);

    const startTime = Date.now();
    await remuxVideo(tempInputPath, tempOutputPath);
    const timeTakenToConvert = Date.now() - startTime;
    log.info(`Video conversion took ${timeTakenToConvert / 1000} seconds.`);
    fs.unlinkSync(tempInputPath);
    return ipc.success({ videoFilePath: tempOutputPath });
  } catch (error) {
    log.error('Failed to remux the video file.', error);
    if (fs.existsSync(tempInputPath)) {
      fs.unlinkSync(tempInputPath);
    }
    if (fs.existsSync(tempOutputPath)) {
      fs.unlinkSync(tempOutputPath);
    }
    return ipc.error('Failed to remux the video file.', error);
  }
})

