import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import MenuBuilder from './menu';
import db from './storage';
import { resolveHtmlPath } from './util';
import logger from './util/logger';
import UploadManager from './util/UploadManager';
import setupVideoAndThumbnailHttpServer from './videoHttpServer';
import { setTokens } from './util/storageHelpers';

const log = logger.child({ module: 'main' });

logger.info('App starting...');

setupVideoAndThumbnailHttpServer();

let mainWindow: BrowserWindow | null = null;

const isDebug = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

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

  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });
};

app.on('ready', () => {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('trace', process.execPath, [path.resolve(process.argv[1])]);
    }
  } else {
    app.setAsDefaultProtocolClient('trace');
  }
  createWindow();
});

app.on('open-url', (event, url) => {
  event.preventDefault();
  handleOpenUrl(url);
});

const handleOpenUrl = (url: string) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
    const parsedUrl = new URL(url);
    const accessToken = parsedUrl.searchParams.get('token');
    const refreshToken = parsedUrl.searchParams.get('refreshToken');
    if (accessToken && refreshToken) {
      log.info('OAuth token received');
      setTokens(accessToken, refreshToken);
      mainWindow.webContents.send('auth-success', { accessToken, refreshToken });
    } else {
      log.error('Error: Missing access token or refresh token');
    }
  }
};

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  log.info('App about to quit.');
});

process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection at:', { promise, reason });
});

ipcMain.on('report-renderer-unhandled-error', (e, error) => {
  log.error('Unhandled Error from renderer:', { error });
});
