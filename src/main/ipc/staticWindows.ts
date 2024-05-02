import { BrowserWindow } from 'electron';

let overlayWindow: BrowserWindow | null = null;
let blinkWindow: BrowserWindow | null = null;

const width = 300;
const height = 100;

const windowSettings = {
  width,
  height,
  frame: false,
  x: 0,
  y: 0,
  alwaysOnTop: true,
  transparent: true,
  hasShadow: false,
  skipTaskbar: true,
};

function configureWindow(window: BrowserWindow, file: string) {
  window.loadFile(file);
  window.setIgnoreMouseEvents(true);
  window.setVisibleOnAllWorkspaces(true);
  window.setAlwaysOnTop(true, 'screen-saver');
  window.setSkipTaskbar(true);
}

function closeWindow(window: BrowserWindow | null) {
  window?.close();
  return null;
}

function showHintWindows() {
  overlayWindow = new BrowserWindow(windowSettings);
  blinkWindow = new BrowserWindow(windowSettings);
  configureWindow(overlayWindow, 'src/staticPages/overlay.html');
  configureWindow(blinkWindow, 'src/staticPages/outline.html');
}

function closeAllHintWindows() {
  overlayWindow = closeWindow(overlayWindow);
  blinkWindow = closeWindow(blinkWindow);
}

function closeOverLayWindow() {
  overlayWindow = closeWindow(overlayWindow);
}

export { showHintWindows, closeAllHintWindows, closeOverLayWindow };
