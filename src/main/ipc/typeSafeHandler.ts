import { ipcMain, ipcRenderer } from 'electron';

import { IPCHandleEvents, IPCOnEvents } from '../../types/customTypes';

export function ipcHandle<Key extends keyof IPCHandleEvents>(
  eventName: Key,
  handler: IPCHandleEvents[Key],
): void {
  ipcMain.handle(eventName, handler);
}

export function ipcMainOn<Key extends keyof IPCOnEvents>(
  eventName: Key,
  handler: IPCOnEvents[Key],
): void {
  ipcMain.on(eventName, handler);
}

type ParametersExceptFirst<T> = T extends (first: any, ...rest: infer P) => any
  ? P
  : never;

export function ipcInvoke<Key extends keyof IPCHandleEvents>(eventName: Key) {
  return (...args: ParametersExceptFirst<IPCHandleEvents[Key]>) =>
    ipcRenderer.invoke(eventName, ...args) as ReturnType<IPCHandleEvents[Key]>;
}

export function ipcSend<Key extends keyof IPCOnEvents>(eventName: Key) {
  return (...args: ParametersExceptFirst<IPCOnEvents[Key]>) =>
    ipcRenderer.send(eventName, ...args);
}
