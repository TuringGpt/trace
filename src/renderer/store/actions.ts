export const setRecordingName = (recordingName: string) =>
  ({
    type: 'setRecordingName',
    payload: { recordingName },
  }) as const;

export const resetRecordingName = () =>
  ({ type: 'resetRecordingName' }) as const;

export const showBusyIndicator = (message: string) =>
  ({
    type: 'setBusyIndicator',
    payload: { isShow: true, message },
  }) as const;

export const hideBusyIndicator = () =>
  ({
    type: 'hideBusyIndicator',
    payload: { isShow: false, message: '' },
  }) as const;

export type Action =
  | ReturnType<typeof resetRecordingName>
  | ReturnType<typeof setRecordingName>
  | ReturnType<typeof showBusyIndicator>
  | ReturnType<typeof hideBusyIndicator>;
