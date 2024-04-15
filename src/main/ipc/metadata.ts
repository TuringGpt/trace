import { app, ipcMain, screen } from 'electron';
import fs from 'fs';
import os from 'os';

import logToFile from '../util/log';

ipcMain.handle('get-device-metadata', async (e, screenId, startTime) => {
  try {
    logToFile('INFO', 'GET_DEVICE_METADATA', `screenId: ${screenId}`);
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
    const downloadsPath = app.getPath('downloads');
    const defaultPath = `${downloadsPath}/${startTime}-metadata.json`;
    fs.writeFileSync(defaultPath, JSON.stringify(metadata));
    logToFile('SUCCESS', 'GET_DEVICE_METADATA', JSON.stringify(metadata));
    return { metadataFilePath: defaultPath };
  } catch (error) {
    logToFile(
      'ERROR',
      'GET_DEVICE_METADATA',
      'Failed to get device metadata.',
      error,
    );
  }
  return null;
});
