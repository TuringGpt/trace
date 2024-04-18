import logger from '../util/logger';
import { ipcMainOn } from './typeSafeHandler';

const log = logger.child({ module: 'ipc.logger.log_from_renderer' });
ipcMainOn('log-from-renderer', (event, args) => {
  const [level, message, ...rest] = args;
  log.log(level, message, rest);
});
