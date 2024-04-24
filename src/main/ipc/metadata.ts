import { screen } from 'electron';
import fs from 'fs';
import os from 'os';

import { ipc } from '../../types/customTypes';
import logger from '../util/logger';
import { getVideoStoragePath } from '../util/storageHelpers';
import { ipcHandle } from './typeSafeHandler';

const log = logger.child({ module: 'ipc.metadata' });

ipcHandle('get-device-metadata', async (e, screenId, startTime) => {
  try {
    log.info('screenId: %s', screenId);
    const display = screen
      .getAllDisplays()
      .find((d) => d.id === Number(screenId));

    const metadata = {
      osType: os.type(),
      osRelease: os.release(),
      cpuModel: os.cpus()[0].model,
      cpuSpeed: os.cpus()[0].speed,
      numCores: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      screenSize: display?.size,
      screenResolution: display?.bounds,
      screenRotation: display?.rotation,
      screenScaleFactor: display?.scaleFactor,
    };

    const defaultPath = `${getVideoStoragePath()}/${startTime}-metadata.json`;
    fs.writeFileSync(defaultPath, JSON.stringify(metadata));
    log.info(JSON.stringify(metadata));

    return ipc.success({ metadataFilePath: defaultPath });
  } catch (error) {
    log.error('Failed to get device metadata.', error);
    return ipc.error('Failed to get device metadata.', error);
  }
});
