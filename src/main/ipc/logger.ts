import { ipcMain } from 'electron';

import logToFile from '../util/log';

ipcMain.on('log-from-renderer', (event, level, ...args) => {
  logToFile(level, 'LOG_FROM_RENDERER', ...args);
});
