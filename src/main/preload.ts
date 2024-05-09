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

function onUploadProgress(callback: (progress: number) => void): () => void {
  ipcRenderer.on('upload-progress', (_event, progress) => {
    callback(progress);
  });
  return () => ipcRenderer.off('upload-progress', callback);
}

const electronHandler = {
  getVideoSources: ipcInvoke('get-video-sources'),

  uploadFiles: ipcInvoke('upload-zip-file'),
  logFromRenderer: ipcSend('log-from-renderer'),
  showDialog: ipcInvoke('show-dialog'),
  reportUnhandledError: ipcSend('report-renderer-unhandled-error'),
  closeOverLayWindow: ipcInvoke('close-overlay-window'),
  startNewRecording: ipcInvoke('start-new-recording'),
  stopRecording: ipcInvoke('stop-recording'),
  renameRecording: ipcInvoke('rename-recording'),
  discardRecording: ipcInvoke('discard-recording'),
  getVideoRecordingFolders: ipcInvoke('get-video-recording-folders'),
  startUploadingRecording: ipcInvoke('start-uploading-recording'),
  mediaRecordingStopped: ipcInvoke('media-recording-stopped'),
  expandOverlayWindow: ipcInvoke('expand-overlay-window'),
  shrinkOverlayWindow: ipcInvoke('shrink-overlay-window'),
  onSelectVideoSource,
  onUploadProgress,
};

export type ElectronHandler = typeof electronHandler;

contextBridge.exposeInMainWorld('electron', electronHandler);
