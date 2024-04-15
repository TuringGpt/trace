import { dialog, ipcMain } from 'electron';

ipcMain.handle('show-dialog', async (event, title, message) => {
  const { response } = await dialog.showMessageBox({
    title,
    message,
    buttons: ['Ok'],
  });
  return response === 0;
});
