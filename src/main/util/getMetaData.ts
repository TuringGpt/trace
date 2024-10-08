import { screen } from 'electron';
import os from 'os';

import storage from '../storage';
import logger from './logger';
import { DeviceMetadata } from '../../types/customTypes';

const log = logger.child({ module: 'util.getMetadata' });
export default async function getDeviceMetadata(): Promise<DeviceMetadata> {
  const db = await storage.getData();

  const selectedDevice =
    db.selectedDisplay?.display_id ?? screen.getPrimaryDisplay().id;

  if (!db.selectedDisplay?.id) {
    log.warn('No display selected, using primary display');
  }

  const display = screen
    .getAllDisplays()
    .find((d) => `${d.id}` === `${selectedDevice}`);

  const metadata: DeviceMetadata = {
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

  return metadata;
}
