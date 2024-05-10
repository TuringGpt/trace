import { FaCloudUploadAlt } from 'react-icons/fa';
import { GiSandsOfTime } from 'react-icons/gi';
import { GoSync } from 'react-icons/go';
import { ImCheckboxChecked, ImCheckboxUnchecked } from 'react-icons/im';
import { MdEdit, MdOutlineCloudSync, MdSyncProblem } from 'react-icons/md';
import { RiDeleteBin2Fill } from 'react-icons/ri';
import { SiCcleaner } from 'react-icons/si';
import { Tooltip } from 'react-tooltip';

import {
  DialogType,
  RecordedFolder,
  StatusTypes,
  UploadItemStatus,
} from '../../types/customTypes';
import log from '../util/logger';
import prettyBytes from '../util/prettyBytes';
import prettyDate from '../util/prettyDate';
import prettyDuration from '../util/prettyDuration';
import Thumbnail from './Thumbnail';

type VideoCardProps = {
  video: RecordedFolder;
  isSelected: boolean;
  uploadProgress: UploadItemStatus;
  onSelect: () => void;
  onUploadTrigger: () => void;
  onDiscardTrigger: () => void;
  multiSelectInProgress: boolean;
};

const isVideoInQueue = (uploadProgress: UploadItemStatus) =>
  uploadProgress.status === StatusTypes.Pending ||
  uploadProgress.status === StatusTypes.Zipping;

const isVideoUploading = (uploadProgress: UploadItemStatus) =>
  uploadProgress.status === StatusTypes.Uploading;

const isVideoUploaded = (uploadProgress: UploadItemStatus) =>
  uploadProgress.status === StatusTypes.Completed;

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
  onDiscardTrigger,
  multiSelectInProgress,
}: VideoCardProps) {
  const needsToBeUploaded =
    !isVideoUploading(uploadProgress) &&
    !isVideoInQueue(uploadProgress) &&
    !isVideoUploaded(uploadProgress) &&
    !video.isUploaded;

  const onCleanUp = async () => {
    const res = await window.electron.showDialog(
      'Clean up',
      'Are you sure you want to delete this from your local?',
      {
        type: DialogType.Confirmation,
        buttons: ['Yes', 'No'],
      },
    );
    if (res.status === 'success' && res.data) {
      const deleteRes = await window.electron.cleanUpFromLocal(video.id);
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

  return (
    <div
      data-video-id={video.id}
      className="relative border border-gray-500 rounded-lg max-w-[400px]"
    >
      <Tooltip id="video-tooltip" />
      {needsToBeUploaded && (
        <div className="absolute top-2 left-2 z-10">
          <div className="cursor-pointer">
            {isSelected && (
              <ImCheckboxChecked size={22} onClick={() => onSelect()} />
            )}
            {!isSelected && (
              <ImCheckboxUnchecked size={22} onClick={() => onSelect()} />
            )}
          </div>
        </div>
      )}

      <Thumbnail videoId={video.id} />
      <div className="p-4 relative">
        <div className="mb-2">
          {/**
           * TODO: Remove static recording time.
           */}
          <p className="text-gray-300 text-sm opacity-50">
            {prettyDuration(video.recordingDuration)}
          </p>

          <div className="flex items-center">
            <h2 className="font-bold mr-2">
              {video.folderName.length > 25
                ? `${video.folderName.substring(0, 25)}...`
                : video.folderName}
            </h2>
            {needsToBeUploaded && (
              <MdEdit className="cursor-pointer opacity-50" />
            )}
          </div>
        </div>
        <p className="text-gray-300 text-sm opacity-50">
          {video.recordingSize && prettyBytes(video.recordingSize)}
        </p>
        <div className="flex justify-between items-center">
          <p className="text-gray-300 text-xs opacity-70">
            Recorded: {prettyDate(video.recordingStartedAt)}
          </p>
          <div className="absolute right-2 top-2">
            {video.isUploaded && (
              <MdOutlineCloudSync
                data-tooltip-id="video-tooltip"
                data-tooltip-content="Uploaded"
                className="mr-2 text-3xl text-indigo-600"
              />
            )}
            {isVideoInQueue(uploadProgress) && (
              <GiSandsOfTime
                data-tooltip-id="video-tooltip"
                data-tooltip-content="In Queue"
                className="mr-2 text-3xl text-yellow-100"
              />
            )}
            {isVideoUploading(uploadProgress) && (
              <GoSync
                data-tooltip-id="video-tooltip"
                data-tooltip-content="Uploading"
                className="mr-2 text-3xl text-indigo-600 animate-spin-slow-reverse"
              />
            )}
            {isUploadError(uploadProgress, video) && (
              <MdSyncProblem
                data-tooltip-id="video-tooltip"
                data-tooltip-content="Upload Failed"
                data-tooltip-variant="error"
                className="mr-2 text-3xl text-red-900"
              />
            )}
          </div>

          <div className="flex space-x-4">
            {needsToBeUploaded && !multiSelectInProgress && (
              <>
                <button
                  type="button"
                  onClick={() => onUploadTrigger()}
                  className="interactive-button bg-indigo-600 w-24"
                >
                  <FaCloudUploadAlt className="mr-2" /> Upload
                </button>
                <button
                  type="button"
                  onClick={() => onDiscardTrigger()}
                  className="w-10 interactive-button bg-red-500 "
                >
                  <span className="sr-only">Delete </span>
                  <RiDeleteBin2Fill />
                </button>
              </>
            )}
            {video.isUploaded && !video.isDeletedFromLocal && (
              <button
                type="button"
                data-tooltip-id="video-tooltip"
                data-tooltip-html="Delete from local<br/> Free up space"
                className="w-14 text-2xl interactive-button bg-green-500"
                onClick={() => onCleanUp()}
              >
                <span className="sr-only">Clean up </span>
                <SiCcleaner />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
