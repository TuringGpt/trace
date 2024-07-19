import { app, shell } from 'electron';
import { ipcHandle } from './typeSafeHandler';
import { ipc } from '../../types/customTypes';
import axiosInstance from '../util/axiosInstance';
import logger from '../util/logger';
import { UPDATES_URL } from '../../constants';

const log = logger.child({ module: 'ipc.appUpdates' });

ipcHandle('check-update-available', async () => {
  try {
    const currentVersion = app.getVersion();
    const response = await axiosInstance.get('/latest-version');
    const ltsVersion = response.data?.version;
    log.info('checking update available', { currentVersion, ltsVersion });
    return ipc.success(currentVersion !== ltsVersion);
  } catch (error) {
    log.error('Failed to fetch the latest version:', error);
    return ipc.error('Failed to fetch the latest version');
  }
});

ipcHandle('open-updates-url', async () => {
  try {
    shell.openExternal(UPDATES_URL);
    return ipc.success(undefined);
  } catch (error) {
    log.error('Failed to open updates url in external browser:', error);
    return ipc.error('Failed to open updates url in external browser');
  }
});
