import { writeFile } from 'fs/promises';

import { ipc } from '../../types/customTypes';
import logger from '../util/logger';
import { getThumbnailPath, saveVideoDuration } from '../util/storageHelpers';
import { ipcHandle } from './typeSafeHandler';

const log = logger.child({ module: 'ipc.thumbnail' });

ipcHandle(
  'save-thumbnail-and-duration',
  async (event, folderId, thumbnailDataUrl, duration) => {
    try {
      await saveVideoDuration(folderId, duration);
      const base64Data = thumbnailDataUrl.replace(
        /^data:image\/png;base64,/,
        '',
      );
      const buffer = Buffer.from(base64Data, 'base64');
      const thumbnailStoragePath = getThumbnailPath();
      const thumbnailPath = `${thumbnailStoragePath}/${folderId}.png`;
      await writeFile(thumbnailPath, buffer);
      return ipc.success(undefined);
    } catch (err) {
      log.error('Failed to save thumbnail and duration', { err });
      return ipc.error('Failed to save thumbnail and duration', err);
    }
  },
);
