import { app, ipcMain } from 'electron';
import fs from 'fs';

import keyLogger from '../util/keylogger';
import logToFile from '../util/log';

ipcMain.on('start-keystrokes-logging', () => {
  keyLogger.startLogging();
  logToFile('INFO', 'KEYSTROKES_LOGGING', 'Keystrokes logging started');
});

ipcMain.handle('stop-keystrokes-logging', async () => {
  const logContent = keyLogger.stopLogging();
  if (!logContent) {
    logToFile(
      'INFO',
      'KEYSTROKES_LOGGING',
      'Keystrokes logging stopped. No logs found.',
    );
    return null;
  }
  const downloadsPath = app.getPath('downloads');

  const defaultPath = `${downloadsPath}/${keyLogger.startTime}-keystrokes.txt`;
  fs.writeFileSync(defaultPath, logContent);
  logToFile(
    'INFO',
    'KEYSTROKES_LOGGING',
    'Keystrokes logging stopped. Log saved.',
  );
  return { keyLogFilePath: defaultPath };
});
