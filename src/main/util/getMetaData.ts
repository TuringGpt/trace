import { DesktopCapturerSource, screen } from 'electron';
import os from 'os';

import storage from '../storage';
import logger from './logger';

const log = logger.child({ module: 'util.getMetadata' });
export default async function getDeviceMetadata() {
  const db = await storage.getData();

  const selectedDevice =
    db.selectedDisplay?.id ?? screen.getPrimaryDisplay().id;

  if (!db.selectedDisplay?.id) {
    log.warn('No display selected, using primary display');
  }

  const display = screen
    .getAllDisplays()
    .find((display) => `${display.id}` === `${selectedDevice}`);

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

  return metadata;
}
