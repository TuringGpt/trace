// handle all inter process communication

import {
  desktopCapturer,
  DesktopCapturerSource,
  ipcMain,
  Menu,
} from 'electron';

ipcMain.handle('get-video-sources', async (event) => {
  const sources = await desktopCapturer.getSources({ types: ['screen'] });
  try {
    const template = sources.map((item: DesktopCapturerSource) => ({
      label: item.name.length > 30 ? `${item.name.slice(0, 30)}...` : item.name,
      click: () => event.sender.send('select-source', item),
    }));
    Menu.buildFromTemplate(template).popup();
  } catch (e) {
    console.error(e);
  }
  return sources;
});
