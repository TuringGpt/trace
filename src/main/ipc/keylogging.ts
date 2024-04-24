import fs from 'fs';

import { ipc } from '../../types/customTypes';
import keyLogger from '../util/keylogger';
import logger from '../util/logger';
import { getVideoStoragePath } from '../util/storageHelpers';
import { ipcHandle, ipcMainOn } from './typeSafeHandler';

const log = logger.child({ module: 'ipc.keylogging' });

ipcMainOn('start-keystrokes-logging', () => {
  keyLogger.startLogging();
  log.info('Keystrokes logging started');
});

ipcHandle('stop-keystrokes-logging', async () => {
  const logContent = keyLogger.stopLogging();
  if (!logContent) {
    log.info('Keystrokes logging stopped. No logs found.');
    return ipc.error('Keystrokes logging stopped. No logs found.');
  }

  const defaultPath = `${getVideoStoragePath()}/${keyLogger.startTime}-keystrokes.txt`;
  fs.writeFileSync(defaultPath, logContent);
  log.info('Keystrokes logging stopped. Log saved.');
  return ipc.success({ keyLogFilePath: defaultPath });
});
