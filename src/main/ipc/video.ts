import { app, desktopCapturer, BrowserWindow, DesktopCapturerSource, Menu } from 'electron';
import remuxVideo from '../util/remuxVideo';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import ffmpegStatic from 'ffmpeg-static-electron';
import fs from 'fs';

import { ipc } from '../../types/customTypes';
import logger from '../util/logger';
import { ipcHandle } from './typeSafeHandler';

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

let ffmpegProcess: ChildProcessWithoutNullStreams | null = null;

// Function to start FFmpeg recording

ipcHandle('start-ffmpeg-recording', async (event, screenId) => {
  const ffmpegPath = ffmpegStatic.path;
  const outputPath = `${app.getPath('downloads')}/${Date.now()}-video.mp4`; // Output in MP4 format
  log.info(`Starting FFmpeg recording to ${outputPath}`);
  log.info(`screenId ${screenId} type of ${typeof screenId}`);
  
  ffmpegProcess = spawn(ffmpegPath, [
    '-f', 'avfoundation',             // Input format for macOS screen capture
    '-i', '1',              // Screen ID, e.g., "1" for macOS
    '-pixel_format', 'yuv420p',            // Use a supported pixel format
    '-c:v', 'libx264',                // Video codec
    '-preset', 'ultrafast',           // Preset for fast encoding, can be adjusted for quality vs speed
    '-r', '30',                       // Frame rate, set to 30 fps or adjust as needed
    outputPath                     // Path for the output file
  ]);

  ffmpegProcess.stderr.on('data', data => {
    log.error(`FFmpeg stderr: ${data.toString()}`);
  });

  ffmpegProcess.on('close', code => {
    log.info(`FFmpeg process exited with code ${code}`);
    event.sender.send('ffmpeg-recording-stopped', code);
  });

  return ipc.success('Recording started');
});





// Function to stop FFmpeg recording
ipcHandle('stop-ffmpeg-recording', async (e) => {
  if (ffmpegProcess) {
    ffmpegProcess.kill('SIGINT'); // Sends SIGINT to gracefully stop FFmpeg
    ffmpegProcess = null;
    return ipc.success('Recording stopped');
  }
  return ipc.error('No recording process found');
});

// Existing remux-video-file function remains unchanged but ensure types are used for all function arguments and returns
ipcHandle('remux-video-file', async (event, uint8Array: Uint8Array) => {
  let tempInputPath = `${app.getPath('downloads')}/temp-input-${Date.now()}-video.webm`;
  let tempOutputPath = `${app.getPath('downloads')}/${Date.now()}-video.mp4`;
  
  try {
    fs.writeFileSync(tempInputPath, uint8Array);

    const startTime = Date.now();
    await remuxVideo(tempInputPath, tempOutputPath);
    const timeTakenToConvert = Date.now() - startTime;
    log.info(`Video conversion took ${timeTakenToConvert / 1000} seconds.`);

    fs.unlinkSync(tempInputPath); // Clean up input file
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
