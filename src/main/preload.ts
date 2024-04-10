// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, DesktopCapturerSource, ipcRenderer } from 'electron';

export type Channels = 'ipc-example';

const electronHandler = {
  ipcRenderer: {
    getVideoSources() {
      return ipcRenderer.invoke('get-video-sources');
    },
    onSelectVideoSource(
      callback: (source: DesktopCapturerSource) => void,
    ): () => void {
      ipcRenderer.on('select-source', (_event, source) => callback(source));
      return () => ipcRenderer.off('select-source', callback);
    },
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
