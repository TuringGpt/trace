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
  getAppVersion: ipcInvoke('get-app-version'),
  checkUpdateAvailable: ipcInvoke('check-update-available'),
  openUpdatesUrl: ipcInvoke('open-updates-url'),
  getVideoSources: ipcInvoke('get-video-sources'),
  uploadFiles: ipcInvoke('upload-zip-file'),
  logFromRenderer: ipcSend('log-from-renderer'),
  showDialog: ipcInvoke('show-dialog'),
  reportUnhandledError: ipcSend('report-renderer-unhandled-error'),
  closeOverLayWindow: ipcInvoke('close-overlay-window'),
  startNewRecording: ipcInvoke('start-new-recording'),
  stopRecording: ipcInvoke('stop-recording'),
  getUniqueKeys: ipcInvoke('get-unique-keys'),
  renameRecording: ipcInvoke('rename-recording'),
  discardRecording: ipcInvoke('discard-recording'),
  discardMultipleRecordings: ipcInvoke('discard-multiple-recordings'),
  cleanUpFromLocal: ipcInvoke('clean-up-from-local'),
  getRecordingMemoryUsage: ipcInvoke('get-recording-memory-usage'),
  getVideoStreamingPort: ipcInvoke('get-video-streaming-port'),
  getRecordingResolution: ipcInvoke('get-recording-resolution'),
  saveThumbnailAndDuration: ipcInvoke('save-thumbnail-and-duration'),
  getVideoRecordingFolders: ipcInvoke('get-video-recording-folders'),
  startUploadingRecording: ipcInvoke('start-uploading-recording'),
  mediaRecordingStopped: ipcInvoke('media-recording-stopped'),
  expandOverlayWindow: ipcInvoke('expand-overlay-window'),
  shrinkOverlayWindow: ipcInvoke('shrink-overlay-window'),
  openGoogleAuth: ipcInvoke('open-google-auth'),
  getTokens: ipcInvoke('get-tokens'),
  removeTokens: ipcInvoke('remove-tokens'),
  saveChunks: ipcInvoke('save-chunk'),
  reportError: ipcInvoke('report-error'),
  onSelectVideoSource,
  onUploadProgress,
};

export type ElectronHandler = typeof electronHandler;

contextBridge.exposeInMainWorld('electron', electronHandler);
