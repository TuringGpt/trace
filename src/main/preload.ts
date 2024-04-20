import { contextBridge, ipcRenderer } from 'electron';

import { CapturedSource } from '../types/customTypes';
import { ipcInvoke, ipcSend } from './ipc/typeSafeHandler';

function onSelectVideoSource(
  callback: (source: CapturedSource) => void,
): () => void {
  ipcRenderer.on('select-source', (_event, source) => {
    callback({
      id: source.id,
      display_id: source.display_id,
      name: source.name,
    });
  });
  return () => ipcRenderer.off('select-source', callback);
}

const electronHandler = {
  getVideoSources: ipcInvoke('get-video-sources'),
  remuxVideoFile: ipcInvoke('remux-video-file'),
  createZipFile: ipcInvoke('create-zip-file'),
  saveZipFile: ipcInvoke('save-zip-file'),
  discardZipFile: ipcInvoke('discard-zip-file'),
  getDeviceMetadata: ipcInvoke('get-device-metadata'),
  startKeystrokesLogging: ipcSend('start-keystrokes-logging'),
  stopKeystrokesLogging: ipcInvoke('stop-keystrokes-logging'),
  uploadFiles: ipcInvoke('upload-zip-file'),
  logFromRenderer: ipcSend('log-from-renderer'),
  showDialog: ipcInvoke('show-dialog'),
  reportUnhandledError: ipcSend('report-renderer-unhandled-error'),
  startNewRecording: ipcInvoke('start-new-recording'),
  onSelectVideoSource,
};

export type ElectronHandler = typeof electronHandler;

contextBridge.exposeInMainWorld('electron', electronHandler);
