import { app } from 'electron';
import ffmpegStatic from 'ffmpeg-static-electron';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';

import fs from 'fs';
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

async function fixWebmDuration(inputPath: string, recordingFolder: string) {
  try {
    log.info('Starting to fix WebM duration');
    const tempOutputPath = path.join(recordingFolder, 'temp-video-2.webm');
    const startTime = Date.now();
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions('-c:v copy')
        .outputOptions('-fflags +genpts')
        .on('end', resolve)
        .on('error', (err, stdout, stderr) => {
          log.error('ffmpeg error:', { err });
          log.error('ffmpeg stdout:', { stdout });
          log.error('ffmpeg stderr:', { stderr });
          reject(err);
        })
        .save(tempOutputPath);
    });
    fs.unlinkSync(inputPath);
    fs.renameSync(tempOutputPath, inputPath);
    const timeTook = Date.now() - startTime;
    log.info('WebM duration fixed successfully.', {
      timeTook: `${timeTook / 1000} seconds`,
      inputPath,
    });
  } catch (error) {
    log.error('Error while fixing WebM issues:', { error, inputPath });
  }
}

function remuxVideo(inputPath: string, outputPath: string) {
  return new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .output(outputPath)
      .videoCodec('libx264')
      .noAudio()
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

export { remuxVideo, fixWebmDuration };
