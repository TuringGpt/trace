// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, DesktopCapturerSource, ipcRenderer } from 'electron';

import { CapturedSource, UploadResult } from '../types/customTypes';

export type ElectronHandler = {
  getVideoSources: () => Promise<DesktopCapturerSource[]>;

  onSelectVideoSource: (
    callback: (source: CapturedSource) => void,
  ) => () => void;

  remuxVideoFile: (uint8Array: Uint8Array) => Promise<
    | {
        videoFilePath: string;
      }
    | string
  >;

  createZipFile: (
    videoFilePath: string,
    keyLogFilePath: string | undefined,
    metadataFilePath: string | undefined,
  ) => Promise<
    | {
        zipFilePath: string;
        zipFileName: string;
      }
    | string
  >;

  saveZipFile: (
    videoFileName: string,
    tempOutputPath: string,
  ) => Promise<string | null>;

  getDeviceMetadata: (
    screenId: string,
    startTime: string,
  ) => Promise<{ metadataFilePath: string } | null>;

  startKeystrokesLogging: () => void;

  stopKeystrokesLogging: () => Promise<{ keyLogFilePath: string } | null>;

  uploadFiles: (zipFilePath: string) => Promise<UploadResult>;

  logFromRenderer: (...args: any[]) => void;

  showDialog: (title: string, message: string) => Promise<boolean>;
};

const electronHandler: ElectronHandler = {
  getVideoSources: () => ipcRenderer.invoke('get-video-sources'),
  onSelectVideoSource: (callback) => {
    ipcRenderer.on('select-source', (_event, source) => {
      callback({
        id: source.id,
        display_id: source.display_id,
        name: source.name,
      });
    });
    return () => ipcRenderer.off('select-source', callback);
  },
  remuxVideoFile: (uint8Array) =>
    ipcRenderer.invoke('remux-video-file', uint8Array),
  createZipFile: (videoFilePath, keyLogFilePath, metadataFilePath) =>
    ipcRenderer.invoke(
      'create-zip-file',
      videoFilePath,
      keyLogFilePath,
      metadataFilePath,
    ),
  saveZipFile: (videoFileName, tempOutputPath) =>
    ipcRenderer.invoke('save-zip-file', videoFileName, tempOutputPath),
  getDeviceMetadata: (screenId, startTime) =>
    ipcRenderer.invoke('get-device-metadata', screenId, startTime),
  startKeystrokesLogging: () => ipcRenderer.send('start-keystrokes-logging'),
  stopKeystrokesLogging: () => ipcRenderer.invoke('stop-keystrokes-logging'),

  uploadFiles: (zipFilePath) =>
    ipcRenderer.invoke('upload-zip-file', zipFilePath),

  logFromRenderer: (...args) => ipcRenderer.send('log-from-renderer', args),

  showDialog: (title, message) =>
    ipcRenderer.invoke('show-dialog', title, message),
};

contextBridge.exposeInMainWorld('electron', electronHandler);
