import { app, BrowserWindow, screen } from 'electron';
import path from 'path';

let overlayWindow: BrowserWindow | null = null;
let blinkWindow: BrowserWindow | null = null;

function showHintWindows() {
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
}

function closeAllHintWindows() {
  overlayWindow?.close();
  overlayWindow = null;
  blinkWindow?.close();
  blinkWindow = null;
}

function closeOverLayWindow() {
  overlayWindow?.close();
  overlayWindow = null;
}

export { showHintWindows, closeAllHintWindows, closeOverLayWindow };
