// src/preload.js

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getVideoSources: () => ipcRenderer.invoke('get-video-sources'),
  invokeContextMenu: (sources) => ipcRenderer.invoke('context-menu', sources),
  selectSource: (callback) => ipcRenderer.on('select-source', callback),
  startKeystrokesLogging: () => ipcRenderer.send('start-keystrokes-logging'),
  stopKeystrokesLogging: () => ipcRenderer.invoke('stop-keystrokes-logging'),
  saveKeystrokesFile: (logContent) => ipcRenderer.invoke('save-keystrokes-file', logContent),
  remuxVideoFile: (uint8Array) => ipcRenderer.invoke('remux-video-file', uint8Array),
  saveZipFile: (videoFileName, tempOutputPath) => ipcRenderer.invoke('save-zip-file', videoFileName, tempOutputPath),
  discardZipFile: (filePath) => ipcRenderer.invoke('discard-zip-file', filePath),
  createZipFile: (videoFilePath, keyLogFilePath) => ipcRenderer.invoke('create-zip-file', videoFilePath, keyLogFilePath),
  uploadFiles: (zipFilePath) => ipcRenderer.invoke('upload-zip-file', zipFilePath),
})

