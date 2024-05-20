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
export const INFO_LABEL = 'info';
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

// Upload page constants
export const ConsentMessage = `By clicking OK, you confirm your consent to upload recorded activities.
Please be aware that uploaded files may contain sensitive information.
Proceeding indicates your acknowledgment and acceptance of this disclosure.`;
export const UPLOAD_CONSENT_MESSAGE = `By clicking OK, you confirm your consent to upload recorded activities. Please be aware that uploaded files may contain sensitive information. Proceeding indicates your acknowledgment and acceptance of this disclosure.`;
export const UPLOAD_SUCCESS_MESSAGE = 'Files uploaded successfully!';
export const SELECT_FILE_ERROR = 'Please select a file';
export const INVALID_FILE_TYPE_ERROR = 'Please select a zip file';
export const UPLOAD_FAILURE_ERROR = 'Failed to upload the file';

// UploadDashboard page constants

export const ConsentTitle = 'Consent Required';
export const LOCAL_STORAGE_INFO = 'used, upload to free up space.';
export const FREE_UP_SPACE_LABEL = 'Click to free up space';
export const UPLOAD_SUCCESS_LOG = 'Started uploading the selected recordings';
export const UPLOAD_FAILURE_LOG =
  'Failed to start uploading the selected recordings';
export const UPLOAD_CANCELLATION_LOG = 'User cancelled the upload';
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
export const RECORDING_STARTED_LOG = 'Recording started';
export const RECORDING_STOPPED_LOG = 'Recording stopped';
export const NO_STREAM_FOUND_LOG = 'No stream found';
export const ERROR_VIDEO_SAVING_LOG = 'Error during video saving';
export const VIDEO_CONVERSION_INDICATOR =
  'Video conversion in progress... \n This may take several minutes.';
export const CHOOSE_VIDEO_SOURCE_TEXT = 'Choose a Video Source';
export const SELECT_SOURCE_TEXT = 'Please select a source to proceed.';

// useAppState constants
export const APP_STATE_HOOK_ERROR =
  'useAppState must be used within a AppStateProvider';

export const ROUTE_VIDEO = '/save-video';
export const ROUTE_UPLOAD = '/upload';
export const ROUTE_UPLOAD_DASHBOARD = '/upload-dashboard';

// ipcLogger constants

export const RENDERER_LOG_MODULE = 'ipc.logger.log_from_renderer';
