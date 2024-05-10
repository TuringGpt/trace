import { FaCloudUploadAlt } from 'react-icons/fa';
import { GoInfo, GoSync } from 'react-icons/go';
import { ImCheckboxChecked, ImCheckboxUnchecked } from 'react-icons/im';
import { IoVideocam } from 'react-icons/io5';
import { MdEdit, MdOutlineCloudSync, MdSyncProblem } from 'react-icons/md';
import { RiDeleteBin2Fill } from 'react-icons/ri';
import { SiCcleaner } from 'react-icons/si';
import { Tooltip } from 'react-tooltip';
import {
  INFO_LABEL, DELETE_LABEL, CLEAN_UP_LABEL, UPLOADED_TOOLTIP,
  UPLOADING_TOOLTIP, UPLOAD_FAILED_TOOLTIP, REMOVE_LOCAL_TOOLTIP,
  MAX_FOLDER_NAME_LENGTH
} from '../../constants';

import { RecordedFolder } from '../../types/customTypes';
import { formatDateInYYYYMMDDHHMM } from '../util/timeFormat';

type VideoCardProps = {
  video: RecordedFolder;
  isSelected: boolean;
  onSelect: () => void;
};

export default function VideoCard({
                                    video,
                                    isSelected,
                                    onSelect,
                                  }: VideoCardProps) {
  const needsToBeUploaded = !video.isUploaded && !video.uploadingInProgress;
  return (
    <div className="relative border border-gray-500 rounded-lg max-w-[400px]">
      <Tooltip id="video-tooltip" />
      {needsToBeUploaded && (
        <div className="absolute top-2 left-2 z-10">
          <div className="cursor-pointer">
            {isSelected ? (
              <ImCheckboxChecked size={22} onClick={onSelect} />
            ) : (
              <ImCheckboxUnchecked size={22} onClick={onSelect} />
            )}
          </div>
        </div>
      )}
      <div className="absolute top-2 right-2 z-10">
        <button type="button">
          <span className="sr-only">{INFO_LABEL}</span>
          <GoInfo size={24} />
        </button>
      </div>
      <div className="w-full h-44 bg-gray-600 flex items-center justify-center text-white">
        <IoVideocam size={32} />
      </div>
      <div className="p-4 relative">
        <div className="mb-2">
          <p className="text-gray-300 text-sm opacity-50">20:00</p>
          <div className="flex items-center">
            <h2 className="font-bold mr-2">
              {video.folderName.length > MAX_FOLDER_NAME_LENGTH
                ? `${video.folderName.substring(0, MAX_FOLDER_NAME_LENGTH)}...`
                : video.folderName}
            </h2>
            {needsToBeUploaded && (
              <MdEdit className="cursor-pointer opacity-50" />
            )}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-gray-300 text-xs opacity-70">
            Recorded: {formatDateInYYYYMMDDHHMM(video.recordingStartedAt)}
          </p>
          <div className="absolute right-2 top-2">
            {video.isUploaded && (
              <MdOutlineCloudSync
                data-tooltip-id="video-tooltip"
                data-tooltip-content={UPLOADED_TOOLTIP}
                className="mr-2 text-3xl text-indigo-600"
              />
            )}
            {video.uploadingInProgress && (
              <GoSync
                data-tooltip-id="video-tooltip"
                data-tooltip-content={UPLOADING_TOOLTIP}
                className="mr-2 text-3xl text-indigo-600 animate-spin-slow-reverse"
              />
            )}
            {!video.isUploaded && video.uploadError && (
              <MdSyncProblem
                data-tooltip-id="video-tooltip"
                data-tooltip-content={UPLOAD_FAILED_TOOLTIP}
                className="mr-2 text-3xl text-red-900"
              />
            )}
          </div>

          <div className="flex space-x-4">
            {needsToBeUploaded && (
              <>
                <button
                  type="button"
                  className="interactive-button bg-indigo-600 w-24"
                >
                  <FaCloudUploadAlt className="mr-2" /> Upload
                </button>
                <button
                  type="button"
                  className="w-10 interactive-button bg-red-500 "
                >
                  <span className="sr-only">{DELETE_LABEL}</span>
                  <RiDeleteBin2Fill />
                </button>
              </>
            )}
            {!needsToBeUploaded && (
              <button
                type="button"
                data-tooltip-id="video-tooltip"
                data-tooltip-content={REMOVE_LOCAL_TOOLTIP}
                className="w-14 text-2xl interactive-button bg-green-500"
              >
                <span className="sr-only">{CLEAN_UP_LABEL}</span>
                <SiCcleaner />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
