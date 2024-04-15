import { Action } from './actions';

export interface AppState {
  zip: {
    zipFileName: string;
    zipFilePath: string;
  };
  busyIndicator: {
    isShow: boolean;
    message: string;
  };
}

// Initial state
export const initialState: AppState = {
  zip: {
    zipFileName: '',
    zipFilePath: '',
  },
  busyIndicator: {
    isShow: false,
    message: '',
  },
};

// Reducer function
export default function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'setZipData':
      return {
        ...state,
        zip: {
          zipFileName: action.payload.zipFileName,
          zipFilePath: action.payload.zipFilePath,
        },
      };
    case 'resetZipData':
      return {
        ...state,
        zip: {
          zipFileName: '',
          zipFilePath: '',
        },
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
