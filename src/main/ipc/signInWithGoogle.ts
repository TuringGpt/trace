import { shell } from 'electron';
import { ipcHandle } from './typeSafeHandler';
import { ipc } from '../../types/customTypes';

ipcHandle('open-google-auth', async () => {
    const authUrl = 'http://localhost:5050/auth/google';
    shell.openExternal(authUrl);
    return ipc.success(undefined);
});
