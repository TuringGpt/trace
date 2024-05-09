import { contextBridge, ipcRenderer } from 'electron';

import { CapturedSource, UploadStatusReport } from '../types/customTypes';
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

function onUploadProgress(
  callback: (progress: { status: UploadStatusReport }) => void,
): () => void {
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
  startNewRecording: ipcInvoke('start-new-recording'),
  stopRecording: ipcInvoke('stop-recording'),
  renameRecording: ipcInvoke('rename-recording'),
  discardRecording: ipcInvoke('discard-recording'),
  getVideoStreamingPort: ipcInvoke('get-video-streaming-port'),
  getRecordingResolution: ipcInvoke('get-recording-resolution'),
  saveThumbnail: ipcInvoke('save-thumbnail'),
  getVideoRecordingFolders: ipcInvoke('get-video-recording-folders'),
  startUploadingRecording: ipcInvoke('start-uploading-recording'),
  onSelectVideoSource,
  onUploadProgress,
};

export type ElectronHandler = typeof electronHandler;

contextBridge.exposeInMainWorld('electron', electronHandler);
