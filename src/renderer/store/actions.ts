import { SET_RECORDING_NAME, RESET_RECORDING_NAME, SET_BUSY_INDICATOR, HIDE_BUSY_INDICATOR } from '../../constants'; // adjust the path as necessary

export const setRecordingName = (recordingName: string) =>
  ({
    type: SET_RECORDING_NAME,
    payload: { recordingName },
  }) as const;

export const resetRecordingName = () =>
  ({ type: RESET_RECORDING_NAME }) as const;

export const showBusyIndicator = (message: string) =>
  ({
    type: SET_BUSY_INDICATOR,
    payload: { isShow: true, message },
  }) as const;

export const hideBusyIndicator = () =>
  ({
    type: HIDE_BUSY_INDICATOR,
    payload: { isShow: false, message: '' },
  }) as const;

export type Action =
  | ReturnType<typeof resetRecordingName>
  | ReturnType<typeof setRecordingName>
  | ReturnType<typeof showBusyIndicator>
  | ReturnType<typeof hideBusyIndicator>;
