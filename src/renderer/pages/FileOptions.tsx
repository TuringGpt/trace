import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import useAppState from '../store/hook';
import log from '../util/logger';

export default function FileOptions() {
  const { state } = useAppState();
  const navigate = useNavigate();
  const { recordingName } = state;
  const [folderName, setFolderName] = useState(recordingName);
  const [videoServerPort, setVideoServerPort] = useState(-1);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [description, setDescription] = useState('');
  const [recordingResolution, setRecordingResolution] = useState({
    width: 1200,
    height: 500,
  });
  const [error, setError] = useState({ folderName: '', description: '' });

  useEffect(() => {
    const fetchVideoServerPort = async () => {
      const portRes = await window.electron.getVideoStreamingPort();
      if (portRes.status === 'error') {
        window.electron.showDialog(
          'error',
          'Failed to retrieve video from storage',
        );
        return;
      }

      setVideoServerPort(portRes.data);
    };
    fetchVideoServerPort();
  }, []);
  useEffect(() => {
    const fetchRecordingResolution = async () => {
      const res = await window.electron.getRecordingResolution(recordingName);
      if (res.status === 'error') {
        log.error('Failed to retrieve recording');
        return;
      }
      log.info('Recording resolution', res.data);
      setRecordingResolution(res.data);
    };
    fetchRecordingResolution();
  }, [recordingName]);
  useEffect(() => {
    const video = videoRef.current;

    if (videoServerPort === -1) {
      return;
    }

    if (!video) {
      return;
    }

    const handleLoadedData = () => {
      const canvas = document.createElement('canvas');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      log.info('Canvas created with', {
        width: canvas.width,
        height: canvas.height,
      });
      const context = canvas.getContext('2d');
      if (!context) return;

      // Seek to the middle of the video
      video.currentTime = video.duration / 2;

      // Wait for the video to seek to the new time
      video.onseeked = () => {
        // Draw the current frame onto the canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        log.debug('Canvas drawn');
        // // Convert the canvas image to a data URL
        const thumbnailDataUrl = canvas.toDataURL('image/png');

        video.currentTime = 0;
        video.onseeked = null;

        // Send the thumbnail data URL to the main process
        window.electron.saveThumbnail(recordingName, thumbnailDataUrl);
      };
    };

    video.addEventListener('loadedmetadata', handleLoadedData);

    // eslint-disable-next-line consistent-return
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedData);
    };
  }, [videoServerPort, recordingName]);

  const onSave = async () => {
    if (!folderName.trim() || !description.trim()) {
      setError({
        folderName: !folderName.trim() ? 'This field is required' : '',
        description: !description.trim() ? 'This field is required' : '',
      });
      return;
    }
    if (description.length < 15) {
      setError({
        description: 'Description should be at least 15 characters long',
        folderName: '',
      });
      return;
    }
    const res = await window.electron.renameRecording(
      recordingName,
      folderName,
      description,
    );
    if (res.status === 'success') {
      navigate('/');
    } else {
      window.electron.showDialog('error', 'Failed to rename recording folder');
    }
  };

  const onDiscard = async () => {
    const res = await window.electron.discardRecording(recordingName);
    if (res.status === 'error') {
      window.electron.showDialog('error', 'Failed to discard recording');
      return;
    }
    navigate('/');
  };

  const aspectRatio =
    (recordingResolution.height / recordingResolution.width) * 100;

  return (
    <div className="flex flex-col justify-center items-center">
      <div className="flex items-center flex-col w-full max-w-2xl rounded-lg m-4 mt-0 p-4">
        <h2 className="text-2xl font-semibold text-white mb-4">
          What is the recording about?
        </h2>
        {videoServerPort !== -1 && (
          <div
            style={{
              width: '100%',
              paddingBottom: `${aspectRatio}%`,
              position: 'relative',
            }}
          >
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              src={`http://localhost:${videoServerPort}/${recordingName}`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
              }}
              className="w-full h-56 rounded-lg"
              crossOrigin="anonymous"
              controls
            />
          </div>
        )}

        {/* Hidden video element for generating high-resolution thumbnails */}
        {videoServerPort !== -1 &&
          recordingResolution.width > 0 &&
          recordingResolution.height > 0 && (
            /* eslint-disable-next-line jsx-a11y/media-has-caption */
            <video
              src={`http://localhost:${videoServerPort}/${recordingName}`}
              style={{
                width: `${recordingResolution.width}px`,
                height: `${recordingResolution.height}px`,
                position: 'absolute',
                visibility: 'hidden',
              }}
              ref={videoRef}
              crossOrigin="anonymous"
            />
          )}

        <label
          className="block text-lg font-medium text-white w-full"
          htmlFor="folderName"
        >
          Name
          <input
            id="folderName"
            className="mt-4 block w-full text-l border-2 border-gray-300 p-2 rounded-md bg-white text-black"
            value={folderName}
            onChange={(e) => {
              setFolderName(e.target.value);
              setError({ ...error, folderName: '' });
            }}
          />
          {error.folderName && (
            <p className="folder-name-error text-red-500">{error.folderName}</p>
          )}
        </label>
        <label
          htmlFor="description"
          className="block text-lg font-medium text-white w-full mt-4"
        >
          Description
          <input
            id="description"
            className="mt-4 block w-full text-l border-2 border-gray-300 p-2 rounded-md bg-white text-black"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setError({ ...error, description: '' });
            }}
          />
          {error.description && (
            <p className="description-error text-red-500">
              {error.description}
            </p>
          )}
        </label>
        <div className="flex items-center mt-16">
          <button
            type="button"
            id="saveVideoBtn"
            className="bg-indigo-600 rounded-md px-4 py-3 text-white mx-3"
            onClick={onSave}
          >
            Save
          </button>
          <button
            type="button"
            id="discardVideoBtn"
            className="bg-red-600 rounded-md px-4 py-3 text-white mx-3"
            onClick={onDiscard}
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}
