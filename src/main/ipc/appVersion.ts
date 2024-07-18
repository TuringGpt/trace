import { app } from 'electron';
import { ipcHandle } from './typeSafeHandler';
import { ipc } from '../../types/customTypes';

ipcHandle('get-app-version', async () => {
  return ipc.success(app.getVersion());
});
