import { app } from 'electron';
import ffmpegStatic from 'ffmpeg-static-electron';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';

import logToFile from './log';

const platformMap: { [key: string]: string } = {
  darwin: 'mac',
  win32: 'win',
  linux: 'linux',
};

const ffmpegPath = app.isPackaged
  ? path.join(
      process.resourcesPath,
      'app.asar.unpacked',
      'node_modules',
      'ffmpeg-static-electron',
      'bin',
      platformMap[process.platform] || process.platform,
      process.arch,
      'ffmpeg',
    )
  : ffmpegStatic.path;

ffmpeg.setFfmpegPath(ffmpegPath);

export default function remuxVideo(inputPath: string, outputPath: string) {
  return new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .output(outputPath)
      // .videoFilters('setpts=N/FRAME_RATE/TB')
      .videoCodec('copy')
      .noAudio()
      .format('mp4')
      .on('end', () => {
        logToFile('INFO', 'VIDEO_REMUXING', 'Video remuxing completed.');
        resolve();
      })
      .on('error', (err: any) => {
        logToFile(
          'ERROR',
          'VIDEO_REMUXING',
          `FFmpeg Error: ${err.message}`,
          err,
        );
        reject(err);
      })
      .run();
  });
}
