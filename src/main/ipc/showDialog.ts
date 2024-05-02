import { dialog } from 'electron';

import { ipc } from '../../types/customTypes';
import { ipcHandle } from './typeSafeHandler';

ipcHandle(
  'show-dialog',
  async (event, title, message, buttonConfiguration = null) => {
    const buttons =
      buttonConfiguration === 'with-cancel' ? ['Ok', 'Cancel'] : ['Ok'];
    const { response } = await dialog.showMessageBox({
      title,
      message,
      buttons,
    });
    return ipc.success(response === 0);
  },
);
