import { ipc } from '../../types/customTypes';
import {
  getCurrentRecordingFolder,
  getVideoStoragePath,
  markRecordingStarted,
  markRecordingStopped,
} from '../storage';
import keylogger from '../util/keylogger';
import logger from '../util/logger';
import { ipcHandle } from './typeSafeHandler';

const log = logger.child({ module: 'ipc.record' });

ipcHandle('start-new-recording', async () => {
  log.info('Recording started');
  await markRecordingStarted();
  keylogger.startLogging();
  log.info('Keystrokes logging started');
  return ipc.success(undefined);
});

ipcHandle('stop-recording', async () => {
  const videoStoragePath = getVideoStoragePath();
  const recordingFolder = await getCurrentRecordingFolder();
  const logContent = keylogger.stopLogging();
  await markRecordingStopped();
  if (!logContent) {
    log.info('Keystrokes logging stopped. No logs found.');
    return ipc.error('Keystrokes logging stopped. No logs found.');
  }
  log.info('Recording stopped');
  return ipc.success({
    videoStoragePath,
    recordingFolder,
  });
});
