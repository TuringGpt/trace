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
    remuxVideoFile: (uint8Array: Uint8Array) =>
      ipcRenderer.invoke('remux-video-file', uint8Array),
    createZipFile: (
      videoFilePath: string,
      keyLogFilePath: string,
      metadataFilePath: string,
    ) =>
      ipcRenderer.invoke(
        'create-zip-file',
        videoFilePath,
        keyLogFilePath,
        metadataFilePath,
      ),

    saveZipFile: (videoFileName: string, tempOutputPath: string) =>
      ipcRenderer.invoke('save-zip-file', videoFileName, tempOutputPath),
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
