import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FIELD_REQUIRED_ERROR,
  MIN_DESCRIPTION_LENGTH_ERROR,
  RENAME_FOLDER_ERROR,
  DISCARD_RECORDING_ERROR,
  ERROR_POPUP_TITLE,
  OK_POPUP_BUTTON,
  VIDEO_RETRIEVE_ERROR_POPUP_MESSAGE,
} from '../../constants';

import useAppState from '../store/hook';
import log from '../util/logger';
import { useDialog } from '../hooks/useDialog';
import { DialogType, IPCResult, Control } from '../../types/customTypes';

export default function FileOptions() {
  const { state } = useAppState();
  const navigate = useNavigate();
  const { recordingName } = state;
  const [folderName, setFolderName] = useState('');
  const [videoServerPort, setVideoServerPort] = useState(-1);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [description, setDescription] = useState('');
  const [recordingResolution, setRecordingResolution] = useState({
    width: 1200,
    height: 500,
  });
  const [error, setError] = useState({
    folderName: '',
    description: '',
    controls: '',
  });
  const { showDialog } = useDialog();
  const [controls, setControls] = useState<Control[]>([]);

  useEffect(() => {
    (async () => {
      const res: IPCResult<string[]> = await window.electron.getUniqueKeys();
      if (res.status === 'success') {
        const uniqueKeys: string[] = res.data;
        log.info('uniqueKeys:', uniqueKeys);
        const initialControls = uniqueKeys.map((key: string) => ({
          key,
          action: '',
        }));
        setControls(initialControls);
      }
    })();
  }, []);

  useEffect(() => {
    const fetchVideoServerPort = async () => {
      const portRes: IPCResult<number> =
        await window.electron.getVideoStreamingPort();
      if (portRes.status === 'error') {
        await showDialog(
          ERROR_POPUP_TITLE,
          VIDEO_RETRIEVE_ERROR_POPUP_MESSAGE,
          {
            type: DialogType.Error,
            buttons: [OK_POPUP_BUTTON],
          },
        );
        return;
      }

      setVideoServerPort(portRes.data);
    };
    fetchVideoServerPort();
  }, [showDialog]);

  useEffect(() => {
    const fetchRecordingResolution = async () => {
      const res: IPCResult<{ width: number; height: number }> =
        await window.electron.getRecordingResolution(recordingName);
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
        window.electron.saveThumbnailAndDuration(
          recordingName,
          thumbnailDataUrl,
          video.duration,
        );
      };
    };

    video.addEventListener('loadedmetadata', handleLoadedData);

    // eslint-disable-next-line consistent-return
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedData);
    };
  }, [videoServerPort, recordingName]);

  const handleControlChange = (
    index: number,
    key: keyof Control,
    value: string,
  ) => {
    const newControls = [...controls];
    newControls[index][key] = value;

    // Check for unique keys
    const uniqueKeys = newControls
      .filter((control, idx) => idx !== index)
      .map((control) => control.key);
    if (uniqueKeys.includes(value)) {
      setError((prevError) => ({
        ...prevError,
        controls: 'Each key must be unique.',
      }));
    } else {
      setControls(newControls);
      setError((prevError) => ({
        ...prevError,
        controls: '',
      }));
    }
  };

  const addControl = () => {
    // Check for empty keys or actions
    const hasEmptyKey = controls.some(
      (control) => control.key === '' || control.action === '',
    );
    if (hasEmptyKey) {
      setError((prevError) => ({
        ...prevError,
        controls:
          'Please fill up empty key and action fields before adding a new control.',
      }));
      return;
    }

    // Check for unique keys
    const keys = controls.map((control) => control.key);
    const hasDuplicateKeys = keys.some((key, idx) => keys.indexOf(key) !== idx);
    if (hasDuplicateKeys) {
      setError((prevError) => ({
        ...prevError,
        controls: 'Each key must be unique.',
      }));
      return;
    }

    setControls([...controls, { key: '', action: '' }]);
  };

  const deleteControl = (index: number) => {
    setControls(controls.filter((_, i) => i !== index));
  };

  const onSave = async () => {
    let hasError = false;

    if (!folderName.trim()) {
      setError((prevError) => ({
        ...prevError,
        folderName: FIELD_REQUIRED_ERROR,
      }));
      hasError = true;
    }
    if (!description.trim()) {
      setError((prevError) => ({
        ...prevError,
        description: FIELD_REQUIRED_ERROR,
      }));
      hasError = true;
    } else if (description.length < 15) {
      setError((prevError) => ({
        ...prevError,
        description: MIN_DESCRIPTION_LENGTH_ERROR,
      }));
      hasError = true;
    }

    if (controls.length === 0) {
      setError((prevError) => ({
        ...prevError,
        controls: 'At least one control is required',
      }));
      hasError = true;
    } else {
      const keys = controls.map((control) => control.key);
      const hasDuplicateKeys = keys.some(
        (key, idx) => keys.indexOf(key) !== idx,
      );
      if (hasDuplicateKeys) {
        setError((prevError) => ({
          ...prevError,
          controls: 'Each key must be unique.',
        }));
        hasError = true;
      }

      controls.forEach((control) => {
        if (!control.action.trim()) {
          setError((prevError) => ({
            ...prevError,
            controls: `Action required for key: ${control.key}`,
          }));
          hasError = true;
        }
      });
    }

    if (hasError) return;

    const res = await window.electron.renameRecording(
      recordingName,
      folderName,
      description,
      controls,
    );
    if (res.status === 'success') {
      navigate('/');
    } else {
      await showDialog(ERROR_POPUP_TITLE, RENAME_FOLDER_ERROR, {
        type: DialogType.Error,
        buttons: [OK_POPUP_BUTTON],
      });
    }
  };

  const onDiscard = async () => {
    const res = await window.electron.discardRecording(recordingName);
    if (res.status === 'error') {
      await showDialog(ERROR_POPUP_TITLE, DISCARD_RECORDING_ERROR, {
        type: DialogType.Error,
        buttons: [OK_POPUP_BUTTON],
      });
      return;
    }
    navigate('/');
  };

  const aspectRatio =
    (recordingResolution.height / recordingResolution.width) * 100;

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-slate-900 text-white">
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

        <div className="w-full mt-4">
          <h3 className="text-xl font-semibold text-white mb-2">Controls</h3>
          {controls.map((control, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={index} className="flex items-center space-x-4 mb-4">
              <input
                className="flex-1 p-2 rounded-md bg-white text-black border-2 border-gray-300"
                placeholder="Key"
                value={control.key}
                onChange={(e) => {
                  handleControlChange(index, 'key', e.target.value);
                }}
              />
              <input
                className="flex-1 p-2 rounded-md bg-white text-black border-2 border-gray-300"
                placeholder="Action"
                value={control.action}
                onChange={(e) => {
                  handleControlChange(index, 'action', e.target.value);
                }}
              />
              <button
                type="button"
                className="bg-red-600 rounded-md px-3 py-2 text-white"
                onMouseDown={(e) => e.preventDefault()} // Prevent blur on button click
                onClick={() => deleteControl(index)}
              >
                X
              </button>
            </div>
          ))}
          {error.controls && (
            <p className="controls-error text-red-500">{error.controls}</p>
          )}
          <div className="w-full flex justify-center mt-8">
            <button
              type="button"
              className="bg-green-600 rounded-md px-4 py-2 text-white"
              onClick={addControl}
            >
              Add Control
            </button>
          </div>
        </div>

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
