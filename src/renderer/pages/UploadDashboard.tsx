import { useEffect, useState } from 'react';
import { FaCloudUploadAlt } from 'react-icons/fa';
import { IoCloseSharp } from 'react-icons/io5';
import { RiDeleteBin2Fill } from 'react-icons/ri';

import { ConsentMessage, ConsentTitle } from '../../constants';
import { DialogType, RecordedFolder } from '../../types/customTypes';
import VideoCard from '../components/VideoCard';
import log from '../util/logger';

export default function UploadDashboard() {
  const [filter, setFilter] = useState('all'); // State to track the active filter
  const [videos, setVideos] = useState<RecordedFolder[]>([]); // State to store the video recordings

  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const res = await window.electron.getVideoRecordingFolders();
      if (res.status === 'success') {
        log.debug('Got the video recordings', res.data);
        setVideos(
          res.data.sort(
            (v1, v2) => v2.recordingStartedAt - v1.recordingStartedAt,
          ),
        );
      }
    })();
  }, []);

  const startUpload = async () => {
    const res = await window.electron.startUploadingRecording(
      Array.from(selectedVideos),
    );
    if (res.status === 'success') {
      log.info('Started uploading the selected recordings', {
        selectedVideos: Array.from(selectedVideos),
      });
    } else {
      log.error('Failed to start uploading the selected recordings', res.error);
    }
  };

  const onBeforeUpload = async () => {
    const selectedVideoIds = Array.from(selectedVideos);
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
      startUpload();
    } else {
      log.info('User cancelled the upload');
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
      </div>
      <div className="mb-4 flex justify-between items-center">
        <p className="text-indigo-600 font-semibold">
          Using 800 MB of Local Storage, upload to cloud to free up space.
        </p>
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
        className="grid grid-cols-3 gap-4 overflow-auto"
        style={{ height: 'calc(100vh - 400px)' }}
      >
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            isSelected={selectedVideos.has(video.id) || false}
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
            <IoCloseSharp className="mr-2 cursor-pointer" />
            <span>{selectedVideos.size} recordings selected</span>
          </div>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onBeforeUpload}
              className="interactive-button bg-indigo-600 w-24"
            >
              <FaCloudUploadAlt className="mr-2" /> Upload
            </button>
            <button
              type="button"
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