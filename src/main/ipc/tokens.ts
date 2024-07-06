import { ipcHandle } from './typeSafeHandler';
import { ipc } from '../../types/customTypes';
import { getTokens, removeTokens } from '../util/storageHelpers';

ipcHandle('get-tokens', async () => {
  const tokens = await getTokens();
  if (tokens) {
    return ipc.success(tokens);
  }
  return ipc.error('Tokens not available');
});

ipcHandle('remove-tokens', async () => {
  removeTokens();
  return ipc.success(undefined);
});
