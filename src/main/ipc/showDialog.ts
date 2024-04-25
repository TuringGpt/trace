import { dialog } from 'electron';

import { ipc } from '../../types/customTypes';
import { ipcHandle } from './typeSafeHandler';

ipcHandle('show-dialog', async (event, title, message, btnType = null) => {
  const buttons = btnType === 'with-cancel' ? ['Ok', 'Cancel'] : ['Ok'];
  const { response } = await dialog.showMessageBox({
    title,
    message,
    buttons,
  });
  return ipc.success(response === 0);
});
