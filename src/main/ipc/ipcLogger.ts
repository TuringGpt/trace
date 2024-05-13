import logger from '../util/logger';
import { ipcMainOn } from './typeSafeHandler';
import { RENDERER_LOG_MODULE } from '../../constants';

const log = logger.child({ module: RENDERER_LOG_MODULE });
ipcMainOn('log-from-renderer', (event, ...args) => {
  const [level, message, ...rest] = args;
  log.log(level, message, rest);
});
