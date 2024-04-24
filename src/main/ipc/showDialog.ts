import { dialog } from 'electron';

import { ipc } from '../../types/customTypes';
import { ipcHandle } from './typeSafeHandler';

ipcHandle('show-dialog', async (event, title, message) => {
  const { response } = await dialog.showMessageBox({
    title,
    message,
    buttons: ['Ok', 'Cancel'],
  });
  return ipc.success(response === 0);
});
