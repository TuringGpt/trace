import Store from 'electron-store';
import { ipcHandle } from './typeSafeHandler';
import { ipc } from '../../types/customTypes';

const store = new Store();

// eslint-disable-next-line import/prefer-default-export
export const setRefreshToken = async (refreshToken: string) => {
  return store.set('refreshToken', refreshToken);
};

ipcHandle('get-refresh-token', async () => {
  const refreshToken: string = store.get('refreshToken') as string;
  if (refreshToken) {
    return ipc.success(refreshToken);
  }
  return ipc.error('Refresh token is not present');
});

ipcHandle('remove-refresh-token', async () => {
  store.delete('refreshToken');
  return ipc.success(undefined);
});
