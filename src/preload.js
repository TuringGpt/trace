// src/preload.js

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getVideoSources: () => ipcRenderer.invoke('get-video-sources'),
  invokeContextMenu: (sources) => ipcRenderer.invoke('context-menu', sources),
  selectSource: (callback) => ipcRenderer.on('select-source', callback),
  startKeystrokesLogging: () => ipcRenderer.send('start-recording'),
  stopKeystrokesLogging: () => ipcRenderer.invoke('stop-recording'),
  saveFile: (uint8Array, directoryPath, fileName) => ipcRenderer.invoke('save-file', uint8Array, directoryPath, fileName),
})

