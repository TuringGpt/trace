/* eslint global-require: off, no-console: off, promise/always-return: off */

// Make sure the configLoader is the first import always, so that the env vars are loaded first
// before any other imports happen
import './configLoader';
import './ipc';

import { app, BrowserWindow, ipcMain, shell } from 'electron';

// import { autoUpdater } from 'electron-updater';
/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { setRefreshToken } from './ipc/refreshToken';
import MenuBuilder from './menu';
import db from './storage';
import { resolveHtmlPath } from './util';
import logger from './util/logger';
import UploadManager from './util/UploadManager';
import setupVideoAndThumbnailHttpServer from './videoHttpServer';

const log = logger.child({ module: 'main' });

logger.info('App starting...');

setupVideoAndThumbnailHttpServer();

// class AppUpdater {
//   constructor() {
//     autoUpdater.logger = log;
//     autoUpdater.checkForUpdatesAndNotify();
//   }
// }

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1300,
    height: 1000,
    x: process.env.START_WIN_X
      ? Number.parseInt(process.env.START_WIN_X, 10)
      : undefined,
    y: process.env.START_WIN_X
      ? Number.parseInt(process.env.START_WIN_X, 10)
      : undefined,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  UploadManager.mainWindowInstance = mainWindow;

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  // new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.setAsDefaultProtocolClient('trace');
app.on('open-url', (event, url) => {
  event.preventDefault();
  if (url.startsWith('trace://auth')) {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      const parsedUrl = new URL(url);
      const token = parsedUrl.searchParams.get('token');
      const refreshToken = parsedUrl.searchParams.get('refreshToken');
      if (token) {
        mainWindow.webContents
          .executeJavaScript(`localStorage.setItem('authToken', '${token}');`)
          .then(() => {
            log.info('OAuth token stored in local storage');
          })
          .catch((err) => {
            log.error('Error storing token in local storage:', err);
          });
      }
      if (refreshToken) {
        setRefreshToken(refreshToken);
      }
    }
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    db.load();
    UploadManager.getInstance();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(log.error);

app.on('before-quit', () => {
  log.info('App about to quit.');
});

process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection at:', { promise, reason });
});

// custom event listener
ipcMain.on('report-renderer-unhandled-error', (e, error) => {
  log.error('Unhandled Error from renderer:', { error });
});
