import { ipcMain, ipcRenderer } from 'electron';

import { IPCHandleEvents, IPCOnEvents } from '../../types/customTypes';

type ParametersExceptFirst<T> = T extends (first: any, ...rest: infer P) => any
  ? P
  : never;

/**
 * For two way communication between main and renderer process.
 * Paired with ipcInvoke in preload script
 * Use this function in main process to handle the event
 * @param eventName
 * @param handler
 */
export function ipcHandle<Key extends keyof IPCHandleEvents>(
  eventName: Key,
  handler: IPCHandleEvents[Key],
): void {
  ipcMain.handle(eventName, handler);
}

/**
 * For two way communication between main and renderer process.
 * Paired with ipcHandle in main process
 * Use this function in preload script to expose the handler to renderer process
 * @param eventName
 * @returns a function that invokes the corresponding ipcRenderer.invoke
 */
export function ipcInvoke<Key extends keyof IPCHandleEvents>(eventName: Key) {
  return (...args: ParametersExceptFirst<IPCHandleEvents[Key]>) => {
    try {
      return ipcRenderer.invoke(eventName, ...args) as ReturnType<
        IPCHandleEvents[Key]
      >;
    } catch (e) {
      console.error('unhandled error in invoke', e);
      throw e;
    }
  };
}

/**
 * For one way communication from renderer to main process
 * Paired with ipcSend in preload script
 * Use this function in main process to handle the event
 * @param eventName
 * @param handler
 */
export function ipcMainOn<Key extends keyof IPCOnEvents>(
  eventName: Key,
  handler: IPCOnEvents[Key],
): void {
  ipcMain.on(eventName, handler);
}

/**
 * For one way communication from renderer to main process
 * Paired with ipcMainOn in main process
 * Use this function in preload script to expose the handler to renderer process
 * @param eventName
 * @returns a function that sends the corresponding ipcRenderer.send
 */
export function ipcSend<Key extends keyof IPCOnEvents>(eventName: Key) {
  return (...args: ParametersExceptFirst<IPCOnEvents[Key]>) =>
    ipcRenderer.send(eventName, ...args);
}
