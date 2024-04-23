import { app, BrowserWindow, screen } from 'electron';
import fs from 'fs';

import path from 'path';
import { ipc } from '../../types/customTypes';
import keyLogger from '../util/keylogger';
import logger from '../util/logger';
import { ipcHandle, ipcMainOn } from './typeSafeHandler';

const log = logger.child({ module: 'ipc.keylogging' });

let overlayWindow: BrowserWindow | null = null;
let blinkWindow: BrowserWindow | null = null;

ipcMainOn('start-keystrokes-logging', () => {
  keyLogger.startLogging();
  BrowserWindow.getFocusedWindow()?.minimize();
  log.info('Keystrokes logging started');

  overlayWindow = new BrowserWindow({
    width: 300,
    height: 100,
    frame: false,
    x: 50,
    y: 50,
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

  const { height, width } = screen.getPrimaryDisplay().bounds;
  console.log('~~~~~~', screen.getPrimaryDisplay());
  blinkWindow = new BrowserWindow({
    width,
    height,
    frame: false,
    x: 0,
    y: 0,
    alwaysOnTop: true,
    transparent: true,
    hasShadow: false,
  });
  blinkWindow.loadFile('src/staticPages/outline.html');
  blinkWindow.setIgnoreMouseEvents(true);
});

ipcHandle('stop-keystrokes-logging', async () => {
  overlayWindow?.close();
  overlayWindow = null;
  blinkWindow?.close();
  blinkWindow = null;
  const logContent = keyLogger.stopLogging();
  if (!logContent) {
    log.info('Keystrokes logging stopped. No logs found.');
    return ipc.error('Keystrokes logging stopped. No logs found.');
  }
  const downloadsPath = app.getPath('downloads');

  const defaultPath = `${downloadsPath}/${keyLogger.startTime}-keystrokes.txt`;
  fs.writeFileSync(defaultPath, logContent);
  log.info('Keystrokes logging stopped. Log saved.');
  return ipc.success({ keyLogFilePath: defaultPath });
});

ipcHandle('close-overlay-window', () => {
  overlayWindow?.close();
  overlayWindow = null;
});
