import { ipcMain } from 'electron';

import logger from '../util/logger';

const log = logger.child({ module: 'ipc.logger.log_from_renderer' });
ipcMain.on('log-from-renderer', (event, args) => {
  const [level, message, ...rest] = args;
  log.log(level, message, rest);
});
