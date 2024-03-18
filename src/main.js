// src/main.js

const { app, BrowserWindow, ipcMain, Menu, desktopCapturer, dialog } = require('electron');
const ffmpeg = require('fluent-ffmpeg');
var ffmpegStatic = require('ffmpeg-static-electron');
ffmpeg.setFfmpegPath(ffmpegStatic.path.replace("app.asar", "app.asar.unpacked"));
const path = require('path');
const fs = require('fs');
const JSZip = require('jszip');
const { BlobServiceClient } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const Keylogger = require('./keylogger.js');
const archiver = require('archiver');
const { once } = require('events');
let keylogger;
const isDev = process.env.MODE !== 'production';
const blobUrl = process.env.BLOB_STORAGE_URL;

if (require('electron-squirrel-startup')) {
  app.quit();
}

const logToFile = (level, context, message, error) => {
  const logFilePath = path.join(app.getPath('userData'), 'app.log');
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${level} - ${context} : ${message}\n`;

  if (isDev) {
    console.log(logMessage, error ? `Error: ${error}` : '');
    return;
  }

  fs.appendFileSync(logFilePath, logMessage);
  if (error) fs.appendFileSync(logFilePath, `Error: ${error}\n`);
};

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
      x: 2650,
      y: 291,
      width: 1300,
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
  createWindow();
  logToFile("INFO", "APPLICATION_STARTUP", "Checking Environment Variables...");
  if (!process.env.MODE || !process.env.BLOB_STORAGE_URL) {
    logToFile("ERROR", "APPLICATION_STARTUP", "Missing environment variables. Please set the environment variables for local development.");
    app.quit();
  } else {
    logToFile("INFO", "APPLICATION_STARTUP", `MODE: ${process.env.MODE}`);
    logToFile("INFO", "APPLICATION_STARTUP", `BLOB URL: ${process.env.BLOB_STORAGE_URL.slice(0, 40)}...`);
    logToFile("SUCCESS", "APPLICATION_STARTUP", "Application started successfully");
  }
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
      label: item.name.length > 30 ? `${item.name.slice(0, 30)}...` : item.name,
      click: () => mainWindow.webContents.send('select-source', item)
    }));
    const contextMenu = Menu.buildFromTemplate(template);
    contextMenu.popup();
  } catch (error) {
    logToFile("ERROR", "CONTEXT_MENU", "Failed to create context menu", error);
    throw error;
  }
});

ipcMain.handle('get-video-sources', async () => {
  try {
    return await desktopCapturer.getSources({ types: ['screen'] });
  } catch (error) {
    logToFile("ERROR", "GET_VIDEO_SOURCES", "Failed to get video sources", error);
    throw error;
  }
});

ipcMain.on('start-keystrokes-logging', () => {
  keylogger = new Keylogger('/Users/suraj/Downloads/key-logs.txt');
  keylogger.startLogging();
  logToFile("INFO", "KEYSTROKES_LOGGING", "Keystrokes logging started");
});

ipcMain.handle('stop-keystrokes-logging', async (event) => {
  if (keylogger) {
    const logContent = keylogger.stopLogging();
    const downloadsPath = app.getPath('downloads');
    const defaultPath = `${downloadsPath}/${keylogger.startTime}-keystrokes.txt`;
    fs.writeFileSync(defaultPath, logContent);
    logToFile("INFO", "KEYSTROKES_LOGGING", "Keystrokes logging stopped. Log saved.");
    return { keyLogFilePath: defaultPath };
  }
});

ipcMain.handle('save-keystrokes-file', async (event, logContent) => {
  if (keylogger) {
    const downloadsPath = app.getPath('downloads');
    const defaultPath = `${downloadsPath}/${keylogger.startTime}-keystrokes.txt`;
    const { filePath } = await dialog.showSaveDialog({
      buttonLabel: 'Save log',
      defaultPath: defaultPath,
    });
    if (filePath) {
      fs.writeFileSync(filePath, logContent);
      logToFile("INFO", "KEYSTROKES_LOGGING", "Keystrokes file saved.");
    } else {
      logToFile("WARN", "KEYSTROKES_LOGGING", "Keystrokes file save cancelled.");
    }
    const directoryPath = path.dirname(filePath);
    return { directoryPath };
  }
});

function remuxVideo(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .output(outputPath)
      .videoFilters('setpts=N/FRAME_RATE/TB')
      .noAudio()
      .format('mp4')
      .on('end', () => {
        logToFile("INFO", "VIDEO_REMUXING", "Video remuxing completed.");
        resolve();
      })
      .on('error', (err) => {
        logToFile("ERROR", "VIDEO_REMUXING", `FFmpeg Error: ${err.message}`, err);
        reject(err);
      })
      .run();
  });
}

function convertVideoToMp4(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .output(outputPath)
      .withVideoCodec('libx264')
      .noAudio()
      .addOptions([
        '-preset superfast',
        '-crf 35'
      ])
      .toFormat('mp4')
      .on('end', () => {
        logToFile("INFO", "VIDEO_CONVERSION", "Video conversion to MP4 completed.");
        resolve();
      })
      .on('error', (err) => {
        logToFile("ERROR", "VIDEO_CONVERSION", `FFmpeg Error: ${err.message}`, err);
        reject(err);
      })
      .run();
  });
}

ipcMain.handle('remux-video-file', async (event, uint8Array) => {
  try {
    const buffer = Buffer.from(uint8Array);
    const downloadsPath = app.getPath('downloads');
    const tempInputPath = `${downloadsPath}/temp-input-${Date.now()}-video.webm`;
    const tempOutputPath = `${downloadsPath}/${Date.now()}-video.mp4`;
    fs.writeFileSync(tempInputPath, buffer);

    logToFile("INFO", "VIDEO_REMUXING", "Video file remuxing started.");
    const startTime = Date.now();
    await remuxVideo(tempInputPath, tempOutputPath);
    const timeTakenToConvert = Date.now() - startTime;
    logToFile("SUCCESS", "VIDEO_REMUXING", `Video conversion took ${timeTakenToConvert/(1000)} seconds.`);
    fs.unlinkSync(tempInputPath);
    return { videoFilePath: tempOutputPath };
  } catch (error) {
    logToFile("ERROR", "VIDEO_REMUXING", "Failed to remux the video file.", error);
    if (fs.existsSync(tempInputPath)) {
      fs.unlinkSync(tempInputPath);
    }
    if (fs.existsSync(tempOutputPath)) {
        fs.unlinkSync(tempOutputPath);
    }
    return `ERROR: check logs at ${path.join(app.getPath('userData'), 'app.log')}`;
  }
})

ipcMain.handle('save-video-file', async (e, zipFileName, zipFilePath) => {
  try {
    const filePath = await dialog.showSaveDialog({
      title: 'Save Recorded Video',
      defaultPath: zipFilePath,
      filters: [{ name: zipFileName, extensions: ['zip'] }]
    });

    if (!filePath.canceled && filePath.filePath) {
      fs.renameSync(zipFilePath, filePath.filePath);
      logToFile("INFO", "VIDEO_SAVE", "Recorded video saved successfully.");
      return filePath.filePath;
    } else {
      fs.unlinkSync(zipFilePath);
      logToFile("WARN", "VIDEO_SAVE", "Video save operation cancelled.");
      return null;
    }
  } catch (error) {
    logToFile("ERROR", "VIDEO_SAVE", "Failed to save the video file.", error);
    return `ERROR: check logs at ${path.join(app.getPath('userData'), 'app.log')}`;
  }
});

ipcMain.handle('discard-video-file', async (e, zipFilePath) => {
  try {
    if (fs.existsSync(zipFilePath)) {
      fs.unlinkSync(zipFilePath);
      logToFile("INFO", "VIDEO_DISCARD", "Video file discarded successfully.");
    }
  } catch (error) {
    logToFile("ERROR", "VIDEO_DISCARD", "Failed to discard the video file.", error);
  }
});

const uploadZipFile = async (content) => {
  logToFile("INFO", "UPLOAD", "Uploading zip file...");
  const blobServiceClient = isDev ? BlobServiceClient.fromConnectionString(blobUrl) : (new BlobServiceClient(blobUrl));
  const containerClient = blobServiceClient.getContainerClient('turing-videos');
  const blobName = `${uuidv4()}.zip`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.uploadData(content);
  return await new Promise(resolve => {
    setTimeout(() => {
      resolve(JSON.stringify({ status: 'Uploaded', zipFileName: blobName }));
    }, 2000);
  });
}

ipcMain.handle('upload-zip-file', async (e, zipFilePath) => {
  try {
    const content = fs.readFileSync(zipFilePath);
    const uploadResponse = await uploadZipFile(content);
    logToFile("SUCCESS", "UPLOAD", `Zip file uploaded successfully. File name - ${JSON.parse(uploadResponse).zipFileName}`);
    return uploadResponse;
  } catch (error) {
    logToFile("ERROR", "UPLOAD", "Failed to upload the zip file.", error);
    return `ERROR: check logs at ${path.join(app.getPath('userData'), 'app.log')}`;
  }
});

ipcMain.handle('create-zip-file', async (event, videoFilePath, keyLogFilePath) => {
  try {
    const downloadsPath = app.getPath('downloads');
    const zipFileName = `${uuidv4()}.zip`;
    const zipFilePath = `${downloadsPath}/${zipFileName}`;
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);
    archive.file(videoFilePath, { name: 'video.mp4' });
    archive.file(keyLogFilePath, { name: 'keylog.txt' });
    await archive.finalize();

    await once(output, 'close');
    logToFile("SUCCESS", "ZIP_CREATION", "Zip file created successfully.");

    fs.unlinkSync(videoFilePath);
    fs.unlinkSync(keyLogFilePath);

    return { zipFilePath, zipFileName };
  } catch (error) {
    logToFile("ERROR", "ZIP_CREATION", "Failed to create zip file.", error);
    return `ERROR: check logs at ${path.join(app.getPath('userData'), 'app.log')}`;
  }
});
