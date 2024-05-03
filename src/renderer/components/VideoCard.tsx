import { FaCloudUploadAlt } from 'react-icons/fa';
import { GoInfo, GoSync } from 'react-icons/go';
import { ImCheckboxChecked, ImCheckboxUnchecked } from 'react-icons/im';
import { IoVideocam } from 'react-icons/io5';
import { MdEdit, MdOutlineCloudSync, MdSyncProblem } from 'react-icons/md';
import { RiDeleteBin2Fill } from 'react-icons/ri';

import { RecordedFolder } from '../../types/customTypes';
import prettyDate from '../util/prettyDate';
import Tooltip from './Tooltip';

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
    <div className="relative border border-gray-500 rounded-lg">
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
      <div className="absolute top-2 right-2 z-10">
        <button type="button">
          <span className="sr-only">info </span>
          <GoInfo size={24} />
        </button>
      </div>
      <div className="w-full h-44 bg-gray-600 flex items-center justify-center text-white">
        <IoVideocam size={32} />
      </div>
      <div className="p-4 relative">
        <div className="mb-2">
          {/**
           * TODO: Remove static recording time.
           */}
          <p className="text-gray-300 text-sm opacity-50">20:00</p>
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
        <div className="flex justify-between items-center">
          <p className="text-gray-300 text-xs opacity-70">
            Recorded: {prettyDate(video.recordingStartedAt)}
          </p>
          <div className="absolute right-2 top-2">
            {video.isUploaded && (
              <Tooltip text="Uploaded">
                <MdOutlineCloudSync className="mr-2 text-3xl text-indigo-600" />
              </Tooltip>
            )}
            {video.uploadingInProgress && (
              <Tooltip text="Uploading">
                <GoSync className="mr-2 text-3xl text-indigo-600 animate-spin-slow-reverse" />
              </Tooltip>
            )}
            {!video.isUploaded && video.uploadError && (
              <Tooltip text="Upload Failed">
                <MdSyncProblem className="mr-2 text-3xl text-red-900" />
              </Tooltip>
            )}
          </div>

          {needsToBeUploaded && (
            <div className="flex space-x-4">
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
                <span className="sr-only">Delete </span>
                <RiDeleteBin2Fill />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
