import { debounce } from 'lodash/fp';
import { useEffect, useState } from 'react';
import { FaCloudUploadAlt } from 'react-icons/fa';
import { IoCloseSharp } from 'react-icons/io5';
import { RiDeleteBin2Fill } from 'react-icons/ri';

import { ConsentMessage, ConsentTitle } from '../../constants';
import {
  DialogType,
  RecordedFolder,
  UploadStatusReport,
} from '../../types/customTypes';
import ProgressBar from '../components/ProgressBar';
import VideoCard from '../components/VideoCard';
import log from '../util/logger';

export default function UploadDashboard() {
  const [filter, setFilter] = useState('all'); // State to track the active filter
  const [videos, setVideos] = useState<RecordedFolder[]>([]); // State to store the video recordings
  const [uploadProgress, setUploadProgress] = useState<UploadStatusReport>({}); // State to store the upload progress

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
    const res = await window.electron.showDialog(ConsentTitle, ConsentMessage, {
      type: DialogType.Confirmation,
      buttons: ['Agree', 'Abort'],
    });
    if (res.status === 'success' && res.data) {
      // Upload the selected videos
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
        {
          // Display the memory usage if available
          memoryUsage !== -1 && (
            <p className="text-indigo-600 font-semibold">
              Using {memoryUsage} MB of Local Storage, upload to cloud to free
              up space.
            </p>
          )
        }

        <div>
          <button
            type="button"
            onClick={() => handleFilterChange('all')}
            className={`px-3 py-1 border-r-2 border-r-slate-400 hover:bg-indigo-500 ${filter === 'all' ? 'bg-indigo-600' : 'bg-gray-600'}`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange('local')}
            className={`px-3 py-1 border-r-2 border-r-slate-400 hover:bg-indigo-500 ${filter === 'local' ? 'bg-indigo-600' : 'bg-gray-600'}`}
          >
            Local
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange('cloud')}
            className={`px-3 py-1  hover:bg-indigo-500 ${filter === 'cloud' ? 'bg-indigo-600' : 'bg-gray-600'}`}
          >
            Cloud
          </button>
        </div>
      </div>
      <div
        className="grid grid-cols-fit-400 gap-4 overflow-auto"
        style={{
          height: 'calc(100vh - 400px)',
        }}
      >
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            multiSelectInProgress={selectedVideos.size > 0}
            uploadProgress={uploadProgress[video.id] || {}}
            isSelected={selectedVideos.has(video.id) || false}
            onUploadTrigger={() => {
              onBeforeUpload(video.id);
            }}
            onDiscardTrigger={() => {
              onBeforeDelete(video.id);
            }}
            onSelect={() => {
              setSelectedVideos((prevState) => {
                const newSelectedVideos = new Set(prevState);
                if (newSelectedVideos.has(video.id)) {
                  newSelectedVideos.delete(video.id);
                } else {
                  newSelectedVideos.add(video.id);
                }
                return newSelectedVideos;
              });
            }}
          />
        ))}
      </div>
      {selectedVideos.size > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-slate-300 p-4 flex items-center justify-between">
          <div className="flex items-center text-black">
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
