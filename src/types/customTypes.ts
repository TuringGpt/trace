import { IpcMainInvokeEvent } from 'electron';

export type CapturedSource = {
  id: string;
  display_id: string;
  name: string;
};

export type UploadResult = {
  status: 'Uploaded' | 'Failed';
  uploadedZipFileName: string;
};

type IPCSuccess<Payload> = {
  status: 'success';
  data: Payload;
};

type IPCError = {
  status: 'error';
  message: string;
  error?: any;
};

export type IPCResult<Payload> = IPCSuccess<Payload> | IPCError;

export const ipc = {
  success: <Payload>(data: Payload): IPCResult<Payload> => ({
    status: 'success' as const,
    data,
  }),
  error: (message: string, error?: any): IPCError => ({
    status: 'error' as const,
    message,
    error,
  }),
};

type IPCHandler<TArgs extends any[], TRes> = (
  event: IpcMainInvokeEvent,
  ...args: TArgs
) => Promise<IPCResult<TRes>>;

export type IPCHandleEvents = {
  'create-zip-file': IPCHandler<
    [videoFilePath: string, keyLogFilePath: string, metadataFilePath: string],
    { zipFilePath: string; zipFileName: string }
  >;
  'save-zip-file': IPCHandler<
    [zipFileName: string, zipFilePath: string],
    string
  >;
  'discard-zip-file': IPCHandler<[zipFilePath: string], boolean>;
  'get-video-sources': IPCHandler<[], void>;
  'remux-video-file': IPCHandler<
    [uint8Array: Uint8Array],
    { videoFilePath: string }
  >;
  'upload-zip-file': IPCHandler<[zipFilePath: string], UploadResult>;
  'show-dialog': IPCHandler<[title: string, message: string], boolean>;
  'get-device-metadata': IPCHandler<
    [screenId: string, startTime: string],
    { metadataFilePath: string }
  >;
  'stop-keystrokes-logging': IPCHandler<[], { keyLogFilePath: string }>;
  'remux-stored-chunks': IPCHandler<[], { videoFilePath: string }>
};

export type IPCOnEvents = {
  'start-keystrokes-logging': (event: IpcMainInvokeEvent) => void;
  'log-from-renderer': (event: IpcMainInvokeEvent, ...args: any[]) => void;
  'report-renderer-unhandled-error': (
    event: IpcMainInvokeEvent,
    error: any,
  ) => void;
  'store-chunk': (event: IpcMainInvokeEvent, uint8Array: Uint8Array) => void;
};
