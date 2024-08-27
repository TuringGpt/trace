import { useEffect } from 'react';
import { FaCloudUploadAlt } from 'react-icons/fa';
import { GiSandsOfTime } from 'react-icons/gi';
import { GoSync } from 'react-icons/go';
import { ImCheckboxChecked, ImCheckboxUnchecked } from 'react-icons/im';
import { MdOutlineCloudSync, MdSyncProblem } from 'react-icons/md';
import { RiDeleteBin2Fill } from 'react-icons/ri';
import { Tooltip } from 'react-tooltip';

import {
  DELETE_LABEL,
  IN_QUEUE_TOOLTIP,
  MAX_FOLDER_NAME_LENGTH,
  UPLOAD_FAILED_TOOLTIP,
  UPLOADED_TOOLTIP,
  UPLOADING_TOOLTIP,
} from '../../constants';
import {
  RecordedFolder,
  StatusTypes,
  UploadItemStatus,
} from '../../types/customTypes';
import log from '../util/logger';
import prettyBytes from '../util/prettyBytes';
import prettyDuration from '../util/prettyDuration';
import { formatDateInYYYYMMDDHHMM } from '../util/timeFormat';
import Thumbnail from './Thumbnail';

type VideoCardProps = {
  video: RecordedFolder;
  isSelected: boolean;
  uploadProgress: UploadItemStatus;
  onSelect: () => void;
  onUploadTrigger: () => void;
  onRetryTrigger: () => void;
  onDiscardTrigger: () => void;
  multiSelectInProgress: boolean;
};

const isVideoInQueue = (uploadProgress: UploadItemStatus) =>
  uploadProgress.status === StatusTypes.Pending ||
  uploadProgress.status === StatusTypes.FetchingUploadURLs;

const isVideoUploading = (uploadProgress: UploadItemStatus) =>
  uploadProgress.status === StatusTypes.Uploading;

const isVideoUploaded = (uploadProgress: UploadItemStatus) =>
  uploadProgress.status === StatusTypes.Uploaded;

const isUploadError = (
  uploadProgress: UploadItemStatus,
  video: RecordedFolder,
) =>
  !isVideoUploading(uploadProgress) &&
  !isVideoInQueue(uploadProgress) &&
  !video.isUploaded &&
  video.uploadError;
export default function VideoCard({
  video,
  isSelected,
  uploadProgress,
  onSelect,
  onUploadTrigger,
  onRetryTrigger,
  onDiscardTrigger,
  multiSelectInProgress,
}: VideoCardProps) {
  const needsToBeUploaded =
    !isVideoUploading(uploadProgress) &&
    !isVideoInQueue(uploadProgress) &&
    !isVideoUploaded(uploadProgress) &&
    !video.isUploaded;

  useEffect(() => {
    const autoCleanUp = async () => {
      if (
        video.isUploaded &&
        !video.isDeletedFromLocal &&
        !isVideoUploading(uploadProgress)
      ) {
        const deleteRes = await window.electron.cleanUpFromLocal([video.id]);
        if (deleteRes.status === 'success') {
          log.info('Recording deleted successfully', {
            recordingId: video.id,
          });
        } else {
          log.error('Failed to delete recording', {
            recordingId: video.id,
            error: deleteRes.error,
          });
        }
      }
    };

    autoCleanUp();
  }, [video, uploadProgress]);

  return (
    <div
      data-video-id={video.id}
      className="relative border border-gray-500 rounded-lg w-[380px] max-h-[340px]"
    >
      <Tooltip id="video-tooltip" />
      {needsToBeUploaded && (
        <div className="absolute top-2 left-2">
          <div className="cursor-pointer">
            {isSelected ? (
              <ImCheckboxChecked size={22} onClick={onSelect} />
            ) : (
              <ImCheckboxUnchecked size={22} onClick={onSelect} />
            )}
          </div>
        </div>
      )}

      <Thumbnail videoId={video.id} />
      <div className="p-4 relative">
        <div className="mb-2">
          <p className="text-gray-300 text-sm opacity-50">
            {prettyDuration(video.recordingDuration)}
          </p>
          <h2 className="font-bold mr-2">
            {video.folderName.length > MAX_FOLDER_NAME_LENGTH
              ? `${video.folderName.substring(0, MAX_FOLDER_NAME_LENGTH)}...`
              : video.folderName}
          </h2>
          <p className="text-gray-300 text-xs opacity-70 my-2">
            Id: {video.id}
          </p>
          <p className="text-gray-300 text-xs opacity-70">
            Recorded: {formatDateInYYYYMMDDHHMM(video.recordingStartedAt)}
          </p>
          <p className="text-gray-300 text-sm opacity-50 my-2">
            {prettyBytes(video.recordingSize)}
          </p>
        </div>
      </div>

      {isVideoInQueue(uploadProgress) && (
        <GiSandsOfTime
          data-tooltip-id="video-tooltip"
          data-tooltip-content={IN_QUEUE_TOOLTIP}
          className="text-3xl text-yellow-100 absolute bottom-28 right-6"
        />
      )}
      {isVideoUploading(uploadProgress) && (
        <>
          {uploadProgress.progress && uploadProgress.progress < 100 && (
            <p className="text-xl font-bold text-green-600 absolute bottom-28 right-16">{`${uploadProgress.progress}%`}</p>
          )}
          <GoSync
            data-tooltip-id="video-tooltip"
            data-tooltip-content={UPLOADING_TOOLTIP}
            className="text-3xl text-indigo-600 animate-spin-slow-reverse absolute bottom-28 right-6"
          />
        </>
      )}
      {needsToBeUploaded && !multiSelectInProgress && (
        <>
          <button
            type="button"
            onClick={
              isUploadError(uploadProgress, video)
                ? onRetryTrigger
                : onUploadTrigger
            }
            className="interactive-button bg-indigo-600 w-24 absolute bottom-4 right-16"
          >
            <FaCloudUploadAlt className="mr-2" />
            {isUploadError(uploadProgress, video) ? 'Retry' : 'Upload'}
          </button>
          <button
            type="button"
            onClick={onDiscardTrigger}
            className="interactive-button bg-red-600 w-9 absolute bottom-4 right-4"
          >
            <span className="sr-only">{DELETE_LABEL}</span>
            <RiDeleteBin2Fill size={24} />
          </button>
        </>
      )}
      {video.isUploaded && !isVideoUploading(uploadProgress) && (
        <MdOutlineCloudSync
          data-tooltip-id="video-tooltip"
          data-tooltip-content={UPLOADED_TOOLTIP}
          className="text-3xl text-indigo-600 absolute bottom-28 right-6"
        />
      )}
      {isUploadError(uploadProgress, video) && (
        <>
          {uploadProgress.progress && uploadProgress.progress < 100 && (
            <p className="text-xl font-bold text-red-600 absolute bottom-28 right-16">{`${uploadProgress.progress}%`}</p>
          )}
          <MdSyncProblem
            data-tooltip-id="video-tooltip"
            data-tooltip-content={UPLOAD_FAILED_TOOLTIP}
            data-tooltip-variant="error"
            className="text-3xl text-red-600 absolute bottom-28 right-6"
          />
        </>
      )}
    </div>
  );
}
