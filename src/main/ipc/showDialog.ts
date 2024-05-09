import { dialog, MessageBoxOptions } from 'electron';

import { DialogType, ipc } from '../../types/customTypes';
import { ipcHandle } from './typeSafeHandler';

const DialogTypeToElectronTypeMap: Record<
  DialogType,
  MessageBoxOptions['type']
> = {
  [DialogType.Error]: 'error',
  [DialogType.Confirmation]: 'info',
};

ipcHandle(
  'show-dialog',
  async (
    event,
    title,
    message,
    options = {
      type: DialogType.Error,
      buttons: ['Ok'],
    },
  ) => {
    const { response } = await dialog.showMessageBox({
      title,
      message,
      buttons: options.buttons,
      type: DialogTypeToElectronTypeMap[options.type],
    });
    return ipc.success(response === 0);
  },
);
