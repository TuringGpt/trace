import { desktopCapturer, DesktopCapturerSource, Menu } from 'electron';
import ffmpegStatic from 'ffmpeg-static-electron';
import { spawn } from 'child_process';
import os from 'os';
import { ipc, DisplaySource } from '../../types/customTypes';
import storage from '../storage';
import logger from '../util/logger';
import { ipcHandle } from './typeSafeHandler';

const log = logger.child({ module: 'ipc.video' });
const ffmpegPath = ffmpegStatic.path;

const useFFmpeg = process.env[`USE_FFMPEG_${os.platform().toUpperCase()}`];

function listFFmpegDevices(): Promise<DisplaySource[]> {
  return new Promise((resolve, reject) => {
    log.info("Spawning FFmpeg to get video sources...");
    const ffmpeg = spawn(ffmpegPath, ['-f', 'avfoundation', '-list_devices', 'true', '-i', 'dummy']);
    const screenDevices: DisplaySource[] = [];

    ffmpeg.stderr.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach(line => {
        if (line.includes('Capture screen')) {
          const match = line.match(/\[(\d+)\]\s+(Capture screen \d+)/);
          if (match) {
            screenDevices.push({ id: match[1], name: match[2] });
          }
        }
      });
    });

    ffmpeg.on('error', (err) => {
      log.error('Error spawning FFmpeg process:', err);
      reject(new Error('Failed to spawn FFmpeg process'));
    });

    ffmpeg.on('close', (code) => {
      if (screenDevices.length > 0) {
        log.info("Found screen devices:", screenDevices);
        resolve(screenDevices);
      } else if (code !== 0) {
        log.error(`FFmpeg process exited with code ${code}`);
        reject(new Error('FFmpeg failed to list devices'));
      } else {
        log.error("No screen devices found.");
        reject(new Error('No screen devices found'));
      }
    });
  });
}

ipcHandle('get-video-sources', async (event) => {
  if (useFFmpeg === "1") {
    try {
      const ffmpegSources = await listFFmpegDevices();
      log.info("FFmpeg sources: ", ffmpegSources);

      const template = ffmpegSources.map((source) => ({
        label: source.name.length > 30 ? `${source.name.slice(0, 30)}...` : source.name,
        click: () => {
          storage.saveProperty('selectedDisplay', {
            id: source.id,
            name: source.name,
            display_id: source.display_id || ''
          });
          return event.sender.send('select-source', source);
        },
      }));
      Menu.buildFromTemplate(template).popup();
    } catch (error) {
      log.error('Failed to get video sources from FFmpeg:', error);
      return ipc.error('Failed to get video sources', error.message);
    }
  } else {
    try {
      console.log(`USE_FFMPEG_${os.platform().toUpperCase()}`);
      const sources = await desktopCapturer.getSources({ types: ['screen'] });
      const template = sources.map((item: DesktopCapturerSource) => ({
        label: item.name.length > 30 ? `${item.name.slice(0, 30)}...` : item.name,
        click: () => {
          storage.saveProperty('selectedDisplay', {
            id: item.id,
            name: item.name,
            display_id: item.display_id,
          });
          return event.sender.send('select-source', item);
        },
      }));
      Menu.buildFromTemplate(template).popup();
    } catch (e) {
      log.error('Failed to get video sources', e);
      return ipc.error('Failed to get video sources', e);
    }
  }
  return ipc.success(undefined);
});
