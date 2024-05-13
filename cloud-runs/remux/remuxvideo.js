const path = require('path');
const { spawn } = require('child_process');
const { Storage } = require('@google-cloud/storage');
const logger = require('./logger');

const storage = new Storage();

exports.processFileUpload = async (message) => {
  const { bucket: inputBucketName, name: inputFileName } = message;
  const outputBucketName = 'processed_video';
  const inputFileExtension = `.${inputFileName.split('.').pop()}`;
  const outputFileName = `processed-${path.basename(inputFileName, inputFileExtension)}.mp4`;

  try {
    logger.info('Starting video processing', {
      inputFileName,
      inputBucketName,
    });

    await processVideoStream(
      inputBucketName,
      inputFileName,
      outputBucketName,
      outputFileName,
    );

    logger.info('Video processed and uploaded successfully!', {
      outputBucketName,
      outputFileName,
    });
  } catch (error) {
    logger.error('Failed to process and upload video', {
      error,
      inputFileName,
    });
  }
};

const processVideoStream = async (
  inputBucketName,
  inputFileName,
  outputBucketName,
  outputFileName,
) => {
  const inputBucket = storage.bucket(inputBucketName);
  const outputBucket = storage.bucket(outputBucketName);

  const inputStream = inputBucket.file(inputFileName).createReadStream();
  const outputStream = outputBucket.file(outputFileName).createWriteStream();
  const ffmpeg = spawn('ffmpeg', [
    '-probesize',
    '500M',
    '-analyzeduration',
    '1000M',
    '-i',
    'pipe:0',
    '-c:v',
    'libx264',
    '-preset',
    'fast',
    '-c:a',
    'aac',
    '-strict',
    'experimental',
    '-b:a',
    '192k',
    '-f',
    'mp4',
    '-movflags',
    'frag_keyframe+empty_moov',
    'pipe:1',
  ]);

  inputStream.pipe(ffmpeg.stdin);
  ffmpeg.stdout.pipe(outputStream);

  return new Promise((resolve, reject) => {
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });
  });
};
