import { desktopCapturer, Menu } from 'electron';

import { ipc } from '../../types/customTypes';
import storage from '../storage';
import logger from '../util/logger';
import { ipcHandle } from './typeSafeHandler';

const log = logger.child({ module: 'ipc.video' });

ipcHandle('get-video-sources', async (event) => {
  const sources = await desktopCapturer.getSources({ types: ['screen'] });
  try {
    // Check if we are in a test environment
    if (process.env.WDIO_TEST) {
      // Automatically select the first source for testing purposes
      const autoSelectedSource = sources[0];
      storage.saveProperty('selectedDisplay', {
        id: autoSelectedSource.id,
        name: autoSelectedSource.name,
        display_id: autoSelectedSource.display_id,
      });
      event.sender.send('select-source', autoSelectedSource);
      return ipc.success(undefined);
    }

    // Normal operation, build menu from sources
    const template = sources.map((item) => ({
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
