import ffmpegStatic from 'ffmpeg-static-electron';
import ffmpeg from 'fluent-ffmpeg';

import logToFile from './log';

ffmpeg.setFfmpegPath(
  ffmpegStatic.path.replace('app.asar', 'app.asar.unpacked'),
);

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
