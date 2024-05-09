import { Action } from './actions';

export interface AppState {
  recordingName: string;
  busyIndicator: {
    isShow: boolean;
    message: string;
  };
}

// Initial state
export const initialState: AppState = {
  recordingName: '',
  busyIndicator: {
    isShow: false,
    message: '',
  },
};

// Reducer function
export default function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'setRecordingName':
      return {
        ...state,
        recordingName: action.payload.recordingName,
      };
    case 'resetRecordingName':
      return {
        ...state,
        recordingName: '',
      };
    case 'setBusyIndicator':
      return {
        ...state,
        busyIndicator: {
          isShow: action.payload.isShow,
          message: action.payload.message,
        },
      };
    case 'hideBusyIndicator':
      return {
        ...state,
        busyIndicator: {
          isShow: action.payload.isShow,
          message: action.payload.message,
        },
      };

    default:
      return state;
  }
}
