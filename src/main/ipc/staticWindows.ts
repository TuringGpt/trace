import { app, BrowserWindow, screen, ipcMain } from 'electron';
import path from 'path';

let overlayWindow: BrowserWindow | null = null;
let blinkWindow: BrowserWindow | null = null;

ipcMain.on('start-keystrokes-logging', () => {
  overlayWindow = new BrowserWindow({
    width: 300,
    height: 100,
    frame: false,
    x: 50,
    y: 50,
    skipTaskbar: true,
    alwaysOnTop: true,
    transparent: true,
    hasShadow: false,
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../../.erb/dll/preload.js'),
    },
  });
  overlayWindow.loadFile('src/staticPages/overlay.html');
  overlayWindow.setVisibleOnAllWorkspaces(true);

  const { height, width } = screen.getPrimaryDisplay().bounds;
  blinkWindow = new BrowserWindow({
    width,
    height,
    frame: false,
    x: 0,
    y: 0,
    alwaysOnTop: true,
    transparent: true,
    hasShadow: false,
    skipTaskbar: true,
  });
  blinkWindow.loadFile('src/staticPages/outline.html');
  blinkWindow.setIgnoreMouseEvents(true);
  blinkWindow.setVisibleOnAllWorkspaces(true);
  blinkWindow.setAlwaysOnTop(true, 'screen-saver');
  blinkWindow.setSkipTaskbar(true);
});

ipcMain.on('stop-keystrokes-logging', () => {
  overlayWindow?.close();
  overlayWindow = null;
  blinkWindow?.close();
  blinkWindow = null;
});

ipcMain.handle('close-overlay-window', () => {
  overlayWindow?.close();
  overlayWindow = null;
});
