// src/main.js

const { app, BrowserWindow, ipcMain, Menu, desktopCapturer, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const Keylogger = require('./keylogger.js');
let keylogger;
const isDev = process.env.MODE === 'development'

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;
const iconExtension = process.platform === 'win32' ? 'ico' : (process.platform === 'darwin' ? 'icns' : 'png');
let iconPath = path.join(__dirname, `assets/icons/icon.${iconExtension}`);
let preloadPath = path.join(__dirname, 'preload.js');
const createWindow = () => {
  if (!isDev) {
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 1000,
      icon: iconPath,
      webPreferences: {
        preload: preloadPath
      },
    });   
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
  } else {
    mainWindow = new BrowserWindow({
      x: 2560, // for local devt
      y: 291, // for local devt
      width: 1200,
      height: 1000,
      icon: iconPath,
      webPreferences: {
        preload: preloadPath
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

ipcMain.on('start-recording', () => {
  keylogger = new Keylogger('/Users/suraj/Downloads/key-logs.txt');
  keylogger.startLogging();
});

ipcMain.handle('stop-recording', async (event) => {
  if (keylogger) {
    const logContent = keylogger.stopLogging();
    const downloadsPath = app.getPath('downloads');
    const defaultPath = `${downloadsPath}/${keylogger.startTime}-keystrokes.txt`;
    const { filePath } = await dialog.showSaveDialog({
      buttonLabel: 'Save log',
      defaultPath: defaultPath,
    });
  
    if (filePath) {
      fs.writeFileSync(filePath, logContent);
    }
    const directoryPath = path.dirname(filePath);
    return { directoryPath, timestamp: keylogger.startTime };
  }
});

ipcMain.handle('save-file', async (event, uint8Array, directoryPath, fileName) => {
  try {
      const buffer = Buffer.from(uint8Array);

      const defaultPath = path.join(directoryPath, fileName);
      let filePath = await dialog.showSaveDialog({
          title: 'Save Recorded Video',
          defaultPath: defaultPath || path.join(app.getPath('videos'), fileName),
          filters: [{ name: 'WebM', extensions: ['webm'] }]
      });

      if (!filePath.canceled && filePath.filePath) {
          fs.writeFileSync(filePath.filePath, buffer);
          return filePath.filePath;
        } else {
          return null;
        }
      } catch (error) {
        console.error('Failed to save the file', error);
        return null;
      }
});
