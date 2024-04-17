import { app, ipcMain } from 'electron';
import fs from 'fs';

import keyLogger from '../util/keylogger';
import logger from '../util/logger';

const log = logger.child({ module: 'ipc.keylogging' });

ipcMain.on('start-keystrokes-logging', () => {
  keyLogger.startLogging();
  log.info('Keystrokes logging started');
});

ipcMain.handle('stop-keystrokes-logging', async () => {
  const logContent = keyLogger.stopLogging();
  if (!logContent) {
    log.info('Keystrokes logging stopped. No logs found.');
    return null;
  }
  const downloadsPath = app.getPath('downloads');

  const defaultPath = `${downloadsPath}/${keyLogger.startTime}-keystrokes.txt`;
  fs.writeFileSync(defaultPath, logContent);
  log.info('Keystrokes logging stopped. Log saved.');
  return { keyLogFilePath: defaultPath };
});
