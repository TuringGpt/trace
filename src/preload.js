// src/preload.js

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getVideoSources: () => ipcRenderer.invoke('get-video-sources'),
  invokeContextMenu: (sources) => ipcRenderer.invoke('context-menu', sources),
  selectSource: (callback) => ipcRenderer.on('select-source', callback),
  startKeystrokesLogging: () => ipcRenderer.send('start-recording'),
  stopKeystrokesLogging: () => ipcRenderer.send('stop-recording')
})

