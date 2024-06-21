import { app } from 'electron';
import ffmpegStatic from 'ffmpeg-static-electron';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';

import logger from './logger';

const log = logger.child({ module: 'util.remuxVideo' });

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
      .videoFilters('setpts=PTS-STARTPTS')
      .videoCodec('libx264')
      .noAudio()
      .outputOptions([
        '-fflags +genpts', // Force FFmpeg to generate PTS if they are missing or incorrect
        '-r 60',
      ])
      .format('mp4')
      .on('end', () => {
        log.info('Video remuxing completed.');
        resolve();
      })
      .on('error', (err: any) => {
        log.error(`FFmpeg Error: ${err.message}`, err);
        reject(err);
      })
      .run();
  });
}
