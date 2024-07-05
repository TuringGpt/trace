import { shell } from 'electron';
import { ipcHandle } from './typeSafeHandler';
import { ipc } from '../../types/customTypes';
import { BACKEND_URL } from '../../constants';

ipcHandle('open-google-auth', async () => {
  const authUrl = `${BACKEND_URL}/auth/google`;
  shell.openExternal(authUrl);
  return ipc.success(undefined);
});
