import { desktopCapturer, DesktopCapturerSource, Menu } from 'electron';

import { ipc } from '../../types/customTypes';
import storage from '../storage';
import logger from '../util/logger';
import { ipcHandle } from './typeSafeHandler';

const log = logger.child({ module: 'ipc.video' });
ipcHandle('get-video-sources', async (event) => {
  const sources = await desktopCapturer.getSources({ types: ['screen'] });
  try {
    const template = sources.map((item: DesktopCapturerSource) => ({
      label: item.name.length > 30 ? `${item.name.slice(0, 30)}...` : item.name,
      click: () => {
        storage.saveProperty('selectedDisplay', {
          id: item.id,
          name: item.name,
          display_id: item.display_id,
        });
        return event.sender.send('select-source', item);
      },
    }));
    Menu.buildFromTemplate(template).popup();
  } catch (e) {
    log.error('Failed to get video sources', e);
    return ipc.error('Failed to get video sources', e);
  }
  return ipc.success(undefined);
});
