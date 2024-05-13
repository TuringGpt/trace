import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FIELD_REQUIRED_ERROR,
  MIN_DESCRIPTION_LENGTH_ERROR,
  RENAME_FOLDER_ERROR,
  DISCARD_RECORDING_ERROR,
} from '../../constants';

import useAppState from '../store/hook';

export default function FileOptions() {
  const { state } = useAppState();
  const navigate = useNavigate();
  const [folderName, setFolderName] = useState(state.recordingName);
  const [description, setDescription] = useState('');
  const [error, setError] = useState({ folderName: '', description: '' });

  const onSave = async () => {
    if (!folderName.trim() || !description.trim()) {
      setError({
        folderName: !folderName.trim() ? FIELD_REQUIRED_ERROR : '',
        description: !description.trim() ? FIELD_REQUIRED_ERROR : '',
      });
      return;
    }
    if (description.length < 15) {
      setError({
        description: MIN_DESCRIPTION_LENGTH_ERROR,
        folderName: '',
      });
      return;
    }
    const res = await window.electron.renameRecording(
      state.recordingName,
      folderName,
      description,
    );
    if (res.status === 'success') {
      navigate('/');
    } else {
      window.electron.showDialog('error', RENAME_FOLDER_ERROR);
    }
  };

  const onDiscard = async () => {
    const res = await window.electron.discardRecording(state.recordingName);
    if (res.status === 'error') {
      window.electron.showDialog('error', DISCARD_RECORDING_ERROR);
      return;
    }
    navigate('/');
  };

  return (
    <div className="flex flex-col justify-center items-center">
      <div className="flex items-center flex-col w-full max-w-2xl rounded-lg m-4 mt-12 p-4">
        <h2 className="text-2xl font-semibold text-white mb-4">
          What is the recording about?
        </h2>
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
