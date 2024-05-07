import { BrowserWindow, app, screen } from 'electron';
import path from 'path';
import storage from '../storage';

let overlayWindow: BrowserWindow | null = null;
let blinkWindow: BrowserWindow | null = null;

const windowSettings = (
  width: number,
  height: number,
  x: number,
  y: number,
) => ({
  width,
  height,
  frame: false,
  x,
  y,
  alwaysOnTop: true,
  transparent: true,
  hasShadow: false,
  skipTaskbar: true,
  webPreferences: {
    preload: app.isPackaged
      ? path.join(__dirname, 'preload.js')
      : path.join(__dirname, '../../../.erb/dll/preload.js'),
  },
});

function configureWindow(
  window: BrowserWindow,
  file: string,
  disableClick: boolean,
) {
  window.loadFile(file);
  window.setVisibleOnAllWorkspaces(true);
  window.setAlwaysOnTop(true, 'screen-saver');
  window.setSkipTaskbar(true);
  window.once('ready-to-show', () => {
    window?.webContents.closeDevTools();
  });
  window.setIgnoreMouseEvents(disableClick);
}

function closeWindow(window: BrowserWindow | null) {
  window?.close();
  return null;
}

async function showHintWindows() {
  // Get screen info
  const db = await storage.getData();
  const selectedDevice =
    db.selectedDisplay?.display_id ?? screen.getPrimaryDisplay().id;

  const display = screen
    .getAllDisplays()
    .find((d) => `${d.id}` === `${selectedDevice}`);

  const { width, height, x, y } = display?.bounds ?? {
    width: 0,
    height: 0,
    x: 0,
    y: 0,
  };

  // Build and configure the windows
  overlayWindow = new BrowserWindow(windowSettings(300, 100, x, y));
  blinkWindow = new BrowserWindow(windowSettings(width, height, x, y));
  configureWindow(overlayWindow, 'src/staticPages/overlay.html', false);
  configureWindow(blinkWindow, 'src/staticPages/outline.html', true);
}

function closeAllHintWindows() {
  overlayWindow = closeWindow(overlayWindow);
  blinkWindow = closeWindow(blinkWindow);
}

function closeOverLayWindow() {
  overlayWindow = closeWindow(overlayWindow);
}

export { showHintWindows, closeAllHintWindows, closeOverLayWindow };
