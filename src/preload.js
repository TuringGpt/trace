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
  saveVideoFile: () => ipcRenderer.invoke('save-video-file'),
  discardVideoFile: (filePath) => ipcRenderer.invoke('discard-video-file', filePath),
})

