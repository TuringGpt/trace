import { debounce } from 'lodash/fp';
import { useEffect, useState } from 'react';
import { FaCloudUploadAlt } from 'react-icons/fa';
import { ImCheckboxChecked, ImCheckboxUnchecked } from 'react-icons/im';
import { IoCloseSharp } from 'react-icons/io5';
import { Tooltip } from 'react-tooltip';

import {
  ABORT_POPUP_BUTTON,
  AGREE_POPUP_BUTTON,
  DELETE_RECORDING_POPUP_TITLE,
  DELETE_RECORDING_POPUT_MESSAGE,
  CONSENT_MESSAGE,
  CONSENT_TITLE,
  FILTER_ALL,
  FILTER_CLOUD,
  FILTER_LOCAL,
  FREE_UP_ALL_MESSAGE,
  FREE_UP_ALL_TITLE,
  FREE_UP_ALL_TOOLTIP,
  FREE_UP_SPACE_LABEL,
  LOCAL_STORAGE_INFO,
  NO_POPUP_BUTTON,
  YES_POPUP_BUTTON,
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
import { useDialog } from '../hooks/useDialog';

export default function UploadDashboard() {
  const [filter, setFilter] = useState('all'); // State to track the active filter
  const [videos, setVideos] = useState<RecordedFolder[]>([]); // State to store the video recordings
  const [uploadProgress, setUploadProgress] = useState<UploadStatusReport>({}); // State to store the upload progress

  const [filteredVideos, setFilteredVideos] = useState<RecordedFolder[]>([]); // State to store the filtered videos

  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [memoryUsage, setMemoryUsage] = useState(-1);

  const { showDialog } = useDialog();

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
    const res = await showDialog(CONSENT_TITLE, CONSENT_MESSAGE, {
      type: DialogType.Confirmation,
      buttons: [AGREE_POPUP_BUTTON, ABORT_POPUP_BUTTON],
    });
    if (res.success) {
      log.info('got consent to upload', {
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
    const res = await showDialog(
      DELETE_RECORDING_POPUP_TITLE,
      DELETE_RECORDING_POPUT_MESSAGE,
      {
        type: DialogType.Confirmation,
        buttons: [YES_POPUP_BUTTON, NO_POPUP_BUTTON],
      },
    );
    if (res.success) {
      // Delete the selected videos
      log.info('got consent to delete', {
        consentedVideos: selectedVideoIds,
      });
      startDelete(overrideSelectVideo);
    } else {
      log.info('User cancelled the delete');
    }
  };

  const handleFreeUpSpace = async () => {
    const res = await showDialog(FREE_UP_ALL_TITLE, FREE_UP_ALL_MESSAGE, {
      type: DialogType.Confirmation,
      buttons: [YES_POPUP_BUTTON, NO_POPUP_BUTTON],
      useNative: true,
    });

    if (res.success) {
      const deleteRes = await window.electron.cleanUpFromLocal([], true);
      if (deleteRes.status === 'success') {
        log.info('Deleted all uploaded recordings');
        setVideos(videos.filter((video) => !video.isUploaded));
      } else {
        log.error('Failed to delete uploaded recordings', deleteRes.error);
      }
    } else {
      log.info('User cancelled the free up space');
    }
  };

  const yetToBeUploadedVideos = videos.filter((video) => !video.isUploaded);

  const uploadedFolderStillInLocal = videos.filter(
    (video) => video.isUploaded && !video.isDeletedFromLocal,
  );

  const handleSelectAll = () => {
    if (selectedVideos.size === videos.length) {
      setSelectedVideos(new Set());
    } else {
      const allVideoIds = yetToBeUploadedVideos.map((video) => video.id);
      setSelectedVideos(new Set(allVideoIds));
    }
  };

  // Update the filter state based on the selected filter
  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
  };

  const clearSelectedVideos = () => {
    setSelectedVideos(new Set());
  };

  return (
    <div className="text-white p-6 relative">
      <Tooltip id="video-dashboard-tooltip" />
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Recorded Library</h1>
        <ProgressBar />
      </div>
      <div className="mb-4 flex justify-between items-center">
        {memoryUsage !== -1 && (
          <div className="flex flex-col">
            <p className="text-indigo-600 font-semibold">
              {prettyBytes(memoryUsage)} {LOCAL_STORAGE_INFO}
            </p>
            {uploadedFolderStillInLocal.length > 0 && (
              <p className="text-gray-400 text-sm">
                <button
                  type="button"
                  aria-label="freeup space"
                  onClick={handleFreeUpSpace}
                  className="focus:outline-none"
                  data-tooltip-content={FREE_UP_ALL_TOOLTIP}
                  data-tooltip-id="video-dashboard-tooltip"
                >
                  {FREE_UP_SPACE_LABEL}
                </button>
              </p>
            )}
          </div>
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
        flex flex-wrap overflow-auto gap-6 justify-evenly
      scrollbar-thumb-indigo-800/80 scrollbar-track-gray-700/25
        scrollbar-thumb-rounded-full
        scrollbar-track-rounded-full scrollbar-thin
        `}
        style={{
          height: 'calc(100vh - 400px)',
        }}
      >
        {filteredVideos.map((video) => (
          <VideoCardWrapper
            video={video}
            key={video.id}
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
          <div className="flex items-center gap-1">
            {selectedVideos.size === yetToBeUploadedVideos.length ? (
              <ImCheckboxChecked
                className="cursor-pointer"
                size={22}
                onClick={clearSelectedVideos}
              />
            ) : (
              <ImCheckboxUnchecked
                className="cursor-pointer"
                size={22}
                onClick={handleSelectAll}
              />
            )}
            <span className="ml-3">Select All</span>
          </div>
          <span className="text-white">
            {selectedVideos.size} recordings selected
          </span>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => onBeforeUpload()}
              className="interactive-button bg-indigo-600 w-24"
            >
              <FaCloudUploadAlt className="mr-2" /> Upload
            </button>

            <IoCloseSharp
              onClick={clearSelectedVideos}
              className="cursor-pointer text-white"
            />
          </div>
        </div>
      )}
    </div>
  );
}
