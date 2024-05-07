import { IpcMainInvokeEvent } from 'electron';
import { z } from 'zod';

const RecordedFolderSchema = z.object({
  folderName: z.string(),
  id: z.string(),
  description: z.string().optional(),
  isUploaded: z.boolean(),
  recordingStartedAt: z.number(),
  recordingStoppedAt: z.number().optional(),
  uploadingInProgress: z.boolean(),
  uploadError: z.string().optional(),
  uploadedAt: z.number().optional(),
});

const SelectedDisplaySchema = z.object({
  id: z.string(),
  display_id: z.string(),
  name: z.string(),
});

export const StorageApplicationStateSchema = z.object({
  currentRecordingFolder: RecordedFolderSchema.optional(),
  isRecording: z.boolean(),
  selectedDisplay: SelectedDisplaySchema.optional(),
  recordingFolders: z.array(RecordedFolderSchema),
});

export type StorageApplicationState = z.infer<
  typeof StorageApplicationStateSchema
>;

export type CapturedSource = {
  id: string;
  display_id: string;
  name: string;
};

export type UploadResult = {
  uploadedZipFileName: string;
};

type IPCSuccess<Payload> = {
  status: 'success';
  data: Payload;
};

type IPCError = {
  status: 'error';
  message: string;
  error?: Error;
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

type DialogType = 'with-cancel' | null;

export type IPCHandleEvents = {
  'get-video-sources': IPCHandler<[], void>;
  'remux-video-file': IPCHandler<[uint8Array: Uint8Array], boolean>;
  'upload-zip-file': IPCHandler<[zipFilePath: string], UploadResult>;
  'show-dialog': IPCHandler<
    [title: string, message: string, type?: DialogType],
    boolean
  >;
  'stop-keystrokes-logging': IPCHandler<[], { keyLogFilePath: string }>;
  'close-overlay-window': IPCHandler<[], void>;
  'start-new-recording': IPCHandler<[], void>;
  'stop-recording': IPCHandler<
    [uint8Array: Uint8Array],
    { recordingFolderName: string }
  >;
  'rename-recording': IPCHandler<
    [folderId: string, newName: string, description: string],
    void
  >;
  'discard-recording': IPCHandler<[folderId: string], void>;
  'media-recording-stopped': IPCHandler<[], void>;
};

export type IPCOnEvents = {
  'log-from-renderer': (event: IpcMainInvokeEvent, ...args: any[]) => void;
  'report-renderer-unhandled-error': (
    event: IpcMainInvokeEvent,
    error: any,
  ) => void;
};
