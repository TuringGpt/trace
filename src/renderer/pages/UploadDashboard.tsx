import { debounce } from 'lodash/fp';
import { useEffect, useState } from 'react';
import { FaCloudUploadAlt } from 'react-icons/fa';
import { IoCloseSharp } from 'react-icons/io5';
import { RiDeleteBin2Fill } from 'react-icons/ri';

import {
  CONSENT_MESSAGE,
  CONSENT_TITLE,
  FILTER_ALL,
  FILTER_CLOUD,
  FILTER_LOCAL,
} from '../../constants';
import {
  DialogType,
  RecordedFolder,
  UploadStatusReport,
} from '../../types/customTypes';
import FilterButton from '../components/FilterButton';
import ProgressBar from '../components/ProgressBar';
import VideoCardWrapper from '../components/VideoCardWrapper';
import log from '../util/logger';
import prettyBytes from '../util/prettyBytes';

export default function UploadDashboard() {
  const [filter, setFilter] = useState('all'); // State to track the active filter
  const [videos, setVideos] = useState<RecordedFolder[]>([]); // State to store the video recordings
  const [uploadProgress, setUploadProgress] = useState<UploadStatusReport>({}); // State to store the upload progress

  const [filteredVideos, setFilteredVideos] = useState<RecordedFolder[]>([]); // State to store the filtered videos

  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [memoryUsage, setMemoryUsage] = useState(-1);

  const fetchMemoryUsage = async () => {
    const usage = await window.electron.getRecordingMemoryUsage();
    if (usage.status === 'success') {
      log.info('Recording memory usage', usage.data);
      setMemoryUsage(usage.data);
    } else {
      log.error('Failed to get recording memory usage', usage.error);
    }
  };
  useEffect(() => {
    const fetchVideoRecordingFolders = debounce(400, async () => {
      log.info('Fetching video recording folders');
      const res = await window.electron.getVideoRecordingFolders();
      fetchMemoryUsage();
      if (res.status === 'success') {
        log.info('Fetched video recording folders', res.data);
        setVideos(
          res.data.sort(
            (v1, v2) => v2.recordingStartedAt - v1.recordingStartedAt,
          ),
        );
      }
    });

    fetchVideoRecordingFolders();

    const cleanUp = window.electron.onUploadProgress((pr) => {
      setUploadProgress(pr.status);
      fetchVideoRecordingFolders();
    });

    return () => {
      cleanUp();
    };
  }, []);

  useEffect(() => {
    if (filter === FILTER_ALL) {
      setFilteredVideos(videos);
    } else if (filter === FILTER_LOCAL) {
      setFilteredVideos(videos.filter((video) => !video.isUploaded));
    } else if (filter === FILTER_CLOUD) {
      setFilteredVideos(videos.filter((video) => video.isUploaded));
    }
  }, [videos, filter]);

  const startUpload = async (overrideSelectVideo?: string) => {
    const itemsForUpload = overrideSelectVideo
      ? [overrideSelectVideo]
      : Array.from(selectedVideos);
    const res = await window.electron.startUploadingRecording(itemsForUpload);
    if (res.status === 'success') {
      log.info('Started uploading the selected recordings', {
        selectedVideos: itemsForUpload,
      });
      setSelectedVideos(new Set());
    } else {
      log.error('Failed to start uploading the selected recordings', res.error);
    }
  };

  const onBeforeUpload = async (overrideSelectVideo?: string) => {
    const selectedVideoIds = overrideSelectVideo
      ? [overrideSelectVideo]
      : Array.from(selectedVideos);
    log.info('Selected videos to upload', selectedVideoIds);
    const res = await window.electron.showDialog(
      CONSENT_TITLE,
      CONSENT_MESSAGE,
      {
        type: DialogType.Confirmation,
        buttons: ['Agree', 'Abort'],
      },
    );
    if (res.status === 'success' && res.data) {
      log.info('got concent to upload', {
        consentedVideos: selectedVideoIds,
      });
      startUpload(overrideSelectVideo);
    } else {
      log.info('User cancelled the upload');
    }
  };

  const startDelete = async (overrideSelectVideo?: string) => {
    const itemsForDelete = overrideSelectVideo
      ? [overrideSelectVideo]
      : Array.from(selectedVideos);
    const res = await window.electron.discardMultipleRecordings(itemsForDelete);
    if (res.status === 'success') {
      log.info('Started deleting the selected recordings', {
        itemsForDelete,
      });
      setSelectedVideos(new Set());
    } else {
      log.error('Failed to start deleting the selected recordings', res.error);
    }
  };

  const onBeforeDelete = async (overrideSelectVideo?: string) => {
    const selectedVideoIds = overrideSelectVideo
      ? [overrideSelectVideo]
      : Array.from(selectedVideos);
    log.info('Selected videos to delete', selectedVideoIds);
    const res = await window.electron.showDialog(
      'Delete Recording',
      'Are you sure you want to delete the selected recordings?',
      {
        type: DialogType.Confirmation,
        buttons: ['Yes', 'No'],
      },
    );
    if (res.status === 'success' && res.data) {
      // Delete the selected videos
      log.info('got concent to delete', {
        consentedVideos: selectedVideoIds,
      });
      startDelete(overrideSelectVideo);
    } else {
      log.info('User cancelled the delete');
    }
  };

  // Update the filter state based on the selected filter
  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
  };
  return (
    <div className="text-white p-6 relative">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Recorded Library</h1>
        <ProgressBar />
      </div>
      <div className="mb-4 flex justify-between items-center">
        {memoryUsage !== -1 && (
          <p className="text-indigo-600 font-semibold">
            Using {prettyBytes(memoryUsage)} of Local Storage, upload to cloud
            to free up space.
          </p>
        )}
        <div>
          <FilterButton
            filter={FILTER_ALL}
            activeFilter={filter}
            handleFilterChange={handleFilterChange}
          >
            All
          </FilterButton>
          <FilterButton
            filter={FILTER_LOCAL}
            activeFilter={filter}
            handleFilterChange={handleFilterChange}
          >
            Local
          </FilterButton>
          <FilterButton
            filter={FILTER_CLOUD}
            activeFilter={filter}
            handleFilterChange={handleFilterChange}
          >
            Cloud
          </FilterButton>
        </div>
      </div>
      <div
        className={`
        grid grid-cols-fit-400 gap-4 overflow-auto
        scrollbar-thumb-indigo-800/80 scrollbar-track-gray-700/25
        scrollbar-thumb-rounded-full
        scrollbar-track-rounded-full scrollbar-thin`}
        style={{
          height: 'calc(100vh - 400px)',
        }}
      >
        {filteredVideos.map((video) => (
          <VideoCardWrapper
            video={video}
            selectedVideos={selectedVideos}
            uploadProgress={uploadProgress}
            onBeforeUpload={onBeforeUpload}
            onBeforeDelete={onBeforeDelete}
            setSelectedVideos={setSelectedVideos}
          />
        ))}
      </div>
      {selectedVideos.size > 0 && (
        <div
          className={`absolute bottom-0 left-1/2
        transform -translate-x-1/2 w-9/12
        bg-slate-900 p-4 flex items-center
        border-2 border-gray-100
        justify-between rounded-3xl`}
        >
          <div className="flex items-center text-white">
            <IoCloseSharp
              onClick={() => {
                setSelectedVideos(new Set());
              }}
              className="mr-2 cursor-pointer"
            />
            <span>{selectedVideos.size} recordings selected</span>
          </div>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => onBeforeUpload()}
              className="interactive-button bg-indigo-600 w-24"
            >
              <FaCloudUploadAlt className="mr-2" /> Upload
            </button>
            <button
              type="button"
              onClick={() => onBeforeDelete()}
              className="w-10 interactive-button bg-red-500"
            >
              <span className="sr-only">Delete </span>
              <RiDeleteBin2Fill />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
