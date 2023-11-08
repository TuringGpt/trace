const { app, BrowserWindow, ipcMain, Menu, desktopCapturer } = require('electron');
const path = require('path');
require('dotenv').config();
const isDev = process.env.MODE === 'development'

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;
const createWindow = () => {
  if (!isDev) {
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 1000,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
      },
    });   
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
  } else {
    mainWindow = new BrowserWindow({
      x: 2560, // for local devt
      y: 291, // for local devt
      width: 1200,
      height: 1000,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js')
      }
    })
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
    mainWindow.webContents.openDevTools();
  }
};

app.whenReady().then(() => {
  createWindow()
	console.log("SUCCESS : MAIN : APPLICATION_STARTUP : application started successfully")
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('context-menu', async (event, sources) => {
  try {
    const template = JSON.parse(sources).map((item) => ({
      label: item.name.length > 30 ? item.name.slice(0, 30) + '...' : item.name,
      click: () => mainWindow.webContents.send('select-source', item)
    }));
    const contextMenu = Menu.buildFromTemplate(template);
    contextMenu.popup();
  } catch (error) {
    console.log("ERROR : MAIN : context-menu > ", error);
    throw error;
  }
});

ipcMain.handle('get-video-sources', async () => {
  try {
    return await desktopCapturer.getSources({ types: ['screen'] });
  } catch (error) {
    console.log("ERROR : MAIN : get-video-sources > ", error);
    throw error;
  }
});