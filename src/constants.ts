// URL Constants
export const BACKEND_URL = `https://trace.turing.com`;
// export const BACKEND_URL = 'http://localhost:3000'; // for local devt
export const UPDATES_URL = 'https://github.com/TuringGpt/trace/releases';

// Action Types constants
export const SET_RECORDING_NAME = 'setRecordingName';
export const RESET_RECORDING_NAME = 'resetRecordingName';
export const SET_BUSY_INDICATOR = 'setBusyIndicator';
export const HIDE_BUSY_INDICATOR = 'hideBusyIndicator';

// AppHeader constants
export const APP_TITLE = 'Trace';
export const APP_SUBTITLE = 'Screen Recorder with clicks and keystrokes';

// BusyOverlay constants
export const LOADING_OVERLAY_ID = 'loadingOverlay';
export const BUSY_MESSAGES_SEPARATOR = '\n';

// NavigationButton constants
export const UPLOAD_DASHBOARD_PATH = '/upload-dashboard';
export const HOME_LABEL = 'Home';
export const UPLOAD_LABEL = 'Upload';

// VideoCard constants
export const DELETE_LABEL = 'Delete';
export const CLEAN_UP_LABEL = 'Clean up';
export const UPLOADED_TOOLTIP = 'Uploaded';
export const UPLOADING_TOOLTIP = 'Uploading';
export const IN_QUEUE_TOOLTIP = 'In Queue';
export const UPLOAD_FAILED_TOOLTIP = 'Upload Failed';
export const REMOVE_LOCAL_TOOLTIP = 'Delete from local<br/> Free up space';
export const MAX_FOLDER_NAME_LENGTH = 25;

// FileOptions constants
export const FIELD_REQUIRED_ERROR = 'This field is required';
export const MIN_DESCRIPTION_LENGTH_ERROR =
  'Description should be at least 15 characters long';
export const RENAME_FOLDER_ERROR = 'Failed to rename recording folder';
export const DISCARD_RECORDING_ERROR = 'Failed to discard recording';

// UploadDashboard page constants
export const CONSENT_TITLE = 'Consent Required';
export const CONSENT_MESSAGE = `By clicking OK, you confirm your consent to upload recorded activities.
Please be aware that uploaded files may contain sensitive information.
Proceeding indicates your acknowledgment and acceptance of this disclosure.`;
export const LOCAL_STORAGE_INFO = 'used, upload to free up space.';
export const FREE_UP_SPACE_LABEL = 'Click to free up space';
export const FILTER_ALL = 'all';
export const FILTER_LOCAL = 'local';
export const FILTER_CLOUD = 'cloud';
export const FREE_UP_ALL_TITLE = 'Free up space';
export const FREE_UP_ALL_MESSAGE =
  'Are you sure you want to delete all the recordings that are already uploaded?';
export const FREE_UP_ALL_TOOLTIP =
  'Delete all recording from your computer, that are already uploaded';

// VideoRecorder constants
export const INITIAL_CONSENT_TEXT =
  'By clicking OK, you consent to record all activities on the screen. Please refrain from typing or viewing sensitive/confidential information.';
export const VIDEO_CONVERSION_INDICATOR =
  'Video conversion in progress... \n This may take several minutes.';
export const CHOOSE_VIDEO_SOURCE_TEXT = 'Choose a Video Source';
export const SELECT_SOURCE_TEXT = 'Please select a source to proceed.';

export const ROUTE_VIDEO = '/save-video';
export const ROUTE_UPLOAD_DASHBOARD = '/upload-dashboard';

// useDialog constants

export const AGREE_POPUP_BUTTON = 'Agree';
export const ABORT_POPUP_BUTTON = 'Abort';
export const OK_POPUP_BUTTON = 'Ok';
export const YES_POPUP_BUTTON = 'Yes';
export const NO_POPUP_BUTTON = 'No';
export const INFO_POPUP_TITLE = 'Info';
export const ERROR_POPUP_TITLE = 'Error';
export const VIDEO_RETRIEVE_ERROR_POPUP_MESSAGE =
  'Failed to retrieve video from storage';
export const CLEANUP_POPUP_TITLE = 'Clean up';
export const CLEANUP_POPUP_MESSAGE =
  'Are you sure you want to delete this from your local? This action cannot be undone.';
export const DELETE_RECORDING_POPUP_TITLE = 'Delete Recording';
export const DELETE_RECORDING_POPUT_MESSAGE =
  'Are you sure you want to delete the selected recordings? It is not uploaded yet. This action cannot be undone.';
