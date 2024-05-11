import { Action } from './actions';
import {
  SET_RECORDING_NAME,
  RESET_RECORDING_NAME,
  SET_BUSY_INDICATOR,
  HIDE_BUSY_INDICATOR,
} from '../../constants';

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
    case SET_RECORDING_NAME:
      return {
        ...state,
        recordingName: action.payload.recordingName,
      };
    case RESET_RECORDING_NAME:
      return {
        ...state,
        recordingName: '',
      };
    case SET_BUSY_INDICATOR:
      return {
        ...state,
        busyIndicator: {
          isShow: action.payload.isShow,
          message: action.payload.message,
        },
      };
    case HIDE_BUSY_INDICATOR:
      return {
        ...state,
        busyIndicator: {
          isShow: action.payload.isShow,
          message: '',
        },
      };

    default:
      return state;
  }
}
