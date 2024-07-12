/* eslint global-require: off, no-console: off, promise/always-return: off */

import './configLoader';
import './ipc';

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

function createWindow() {
    const RESOURCES_PATH = app.isPackaged ? path.join(process.resourcesPath, 'assets') : path.join(__dirname, '../../assets');
    const getAssetPath = (...paths: string[]) => path.join(RESOURCES_PATH, ...paths);

    mainWindow = new BrowserWindow({
        show: false,
        width: 1300,
        height: 1000,
        icon: getAssetPath('icon.png'),
        webPreferences: {
            preload: app.isPackaged ? path.join(__dirname, 'preload.js') : path.join(__dirname, '../../.erb/dll/preload.js'),
        },
    });

    mainWindow.loadURL(resolveHtmlPath('index.html'));
    UploadManager.mainWindowInstance = mainWindow;

    mainWindow.on('ready-to-show', () => {
        if (!mainWindow) throw new Error('"mainWindow" is not defined');
        if (process.env.START_MINIMIZED) {
            mainWindow.minimize();
        } else {
            mainWindow.show();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    new MenuBuilder(mainWindow).buildMenu();
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });
}

function handleOpenUrl(url: string) {
    log.info('Handle open URL', { url });
    const parsedUrl = new URL(url);
    const accessToken = parsedUrl.searchParams.get('token');
    const refreshToken = parsedUrl.searchParams.get('refreshToken');

    if (accessToken && refreshToken) {
        log.info('OAuth tokens received', { accessToken, refreshToken });
        setTokens(accessToken, refreshToken);
        mainWindow?.reload();
    } else {
        log.error('Error: Missing access token or refresh token');
    }
}

if (!app.requestSingleInstanceLock()) {
    app.quit();
} else {
    app.on('second-instance', (_, commandLine) => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
        const url = commandLine.find(arg => arg.startsWith('trace://'));
        if (url) handleOpenUrl(url);
    });

    app.on('open-url', (event, url) => {
        event.preventDefault();
        handleOpenUrl(url);
    });

    app.whenReady().then(() => {
        if (!app.isDefaultProtocolClient('trace')) app.setAsDefaultProtocolClient('trace');
        createWindow();
        db.load();
        UploadManager.getInstance();
    }).catch(log.error);

    app.on('activate', () => {
        if (mainWindow === null) createWindow();
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit();
    });
}

app.on('before-quit', () => log.info('App about to quit.'));
process.on('uncaughtException', error => log.error('Uncaught Exception:', error));
process.on('unhandledRejection', (reason, promise) => log.error('Unhandled Rejection at:', { promise, reason }));
ipcMain.on('report-renderer-unhandled-error', (e, error) => log.error('Unhandled Error from renderer:', { error }));
