import { app } from 'electron';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import { createServer } from 'http';
import { join } from 'path';

import logger from './util/logger';

const log = logger.child({ module: 'util.videoHttpServer' });

let videoServerPort = -1;

export default function setupVideoAndThumbnailHttpServer() {
  const server = createServer(async (req, res) => {
    if (!req.url) {
      res.writeHead(404);
      return res.end();
    }
    if (req.url.startsWith('/thumbnails/')) {
      const imageName = req.url.substring('/thumbnails/'.length);
      const imagePath = join(
        app.getPath('userData'),
        'thumbnails',
        `${imageName}.png`,
      );

      try {
        await stat(imagePath);
      } catch (e) {
        log.error('Image file not found', { imagePath });
        res.writeHead(404);
        return res.end();
      }

      res.writeHead(200, { 'Content-Type': 'image/png' });
      createReadStream(imagePath).pipe(res);
    } else {
      const videoPath = join(
        app.getPath('userData'),
        'video-storage',
        req.url,
        'video.mp4',
      );

      try {
        await stat(videoPath);
      } catch (e) {
        log.error('Video file not found', { videoPath });
        res.writeHead(404);
        return res.end();
      }

      const { size } = await stat(videoPath);
      const { range } = req.headers;
      res.setHeader('Access-Control-Allow-Origin', '*');

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : size - 1;

        if (start >= size) {
          res.writeHead(416, { 'Content-Range': `bytes */${size}` });
          return res.end();
        }

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': end - start + 1,
          'Content-Type': 'video/mp4',
        });

        createReadStream(videoPath, { start, end }).pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': size,
          'Content-Type': 'video/mp4',
        });

        createReadStream(videoPath).pipe(res);
      }
    }
    return null;
  }).listen(0, () => {
    const address = server.address();
    if (typeof address === 'string' || !address) {
      log.error('Failed to start video server', { address });
      return;
    }
    videoServerPort = address.port;
    log.info('Video server started', { port: address.port });
  });
}

export function getVideoServerPort() {
  return videoServerPort;
}
