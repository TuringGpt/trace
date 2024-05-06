import { BrowserWindow, screen } from 'electron';

let overlayWindow: BrowserWindow | null = null;
let blinkWindow: BrowserWindow | null = null;

const windowSettings = (width: number, height: number) => ({
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

function configureWindow(
  window: BrowserWindow,
  file: string,
  disableClick = true,
) {
  window.loadFile(file);
  window.setIgnoreMouseEvents(disableClick);
  window.setVisibleOnAllWorkspaces(true);
  window.setAlwaysOnTop(true, 'screen-saver');
  window.setSkipTaskbar(true);
}

function closeWindow(window: BrowserWindow | null) {
  window?.close();
  return null;
}

function showHintWindows() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  overlayWindow = new BrowserWindow(windowSettings(300, 100));
  blinkWindow = new BrowserWindow(windowSettings(width, height));
  configureWindow(overlayWindow, 'src/staticPages/overlay.html', false);
  configureWindow(blinkWindow, 'src/staticPages/outline.html');
  // close dev tools for both windows
  overlayWindow.once('ready-to-show', () => {
    overlayWindow?.webContents.closeDevTools();
  });
  blinkWindow.once('ready-to-show', () => {
    blinkWindow?.webContents.closeDevTools();
  });
}

function closeAllHintWindows() {
  overlayWindow = closeWindow(overlayWindow);
  blinkWindow = closeWindow(blinkWindow);
}

function closeOverLayWindow() {
  overlayWindow = closeWindow(overlayWindow);
}

export { showHintWindows, closeAllHintWindows, closeOverLayWindow };
