import { IpcMainInvokeEvent } from 'electron';
import { z } from 'zod';

const RecordedFolderSchema = z.object({
  folderName: z.string(),
  id: z.string(),
  description: z.string().optional(),
  isUploaded: z.boolean(),
  recordingSize: z.number().optional(),
  recordingDuration: z.number().optional(),
  recordingStartedAt: z.number(),
  recordingStoppedAt: z.number().optional(),
  isDeletedFromLocal: z.boolean().optional(),
  uploadingInProgress: z.boolean(),
  uploadError: z.string().optional(),
  uploadedAt: z.number().optional(),
});

export type RecordedFolder = z.infer<typeof RecordedFolderSchema>;

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

export enum DialogType {
  /**
   * Only has an ok button
   */
  Error = 'Error',
  /**
   * Has ok and cancel buttons
   */
  Confirmation = 'Confirmation',
}

export type DialogOptions = {
  type: DialogType;
  buttons: [okButton: string, cancelButton: string] | [okButton: string];
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

export enum StatusTypes {
  Pending = 'Pending',
  Zipping = 'Zipping',
  Uploading = 'Uploading',
  Completed = 'Completed',
  Failed = 'Failed',
}

export type UploadItemStatus =
  | {
      status: Exclude<StatusTypes, StatusTypes.Uploading>;
    }
  | {
      status: StatusTypes.Uploading;
      progress: number;
    };

export type UploadStatusReport = Record<string, UploadItemStatus>;

export function isUploadingStatus(status: UploadItemStatus): status is Extract<
  UploadItemStatus,
  {
    status: StatusTypes.Uploading;
  }
> {
  return status.status === StatusTypes.Uploading;
}

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
  'get-video-sources': IPCHandler<[], void>;
  'remux-video-file': IPCHandler<[uint8Array: Uint8Array], boolean>;
  'upload-zip-file': IPCHandler<[zipFilePath: string], UploadResult>;
  'show-dialog': IPCHandler<
    [title: string, message: string, options?: DialogOptions],
    boolean
  >;
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
  'clean-up-from-local': IPCHandler<[folderId: string], void>;
  'discard-multiple-recordings': IPCHandler<[folderIds: string[]], void>;
  'save-thumbnail-and-duration': IPCHandler<
    [folderId: string, thumbnailDataUrl: string, duration: number],
    void
  >;
  'get-recording-memory-usage': IPCHandler<[], number>;
  'get-video-streaming-port': IPCHandler<[], number>;
  'media-recording-stopped': IPCHandler<[], void>;
  'expand-overlay-window': IPCHandler<[], void>;
  'shrink-overlay-window': IPCHandler<[], void>;
  'get-video-recording-folders': IPCHandler<[], RecordedFolder[]>;
  'get-recording-resolution': IPCHandler<
    [folderId: string],
    { width: number; height: number }
  >;
  'start-uploading-recording': IPCHandler<[folderIds: string[]], boolean>;
  'close-overlay-window': IPCHandler<[], void>;
  'open-google-auth': IPCHandler<[], void>;
};

export type IPCOnEvents = {
  'log-from-renderer': (event: IpcMainInvokeEvent, ...args: any[]) => void;
  'report-renderer-unhandled-error': (
    event: IpcMainInvokeEvent,
    error: any,
  ) => void;
};
