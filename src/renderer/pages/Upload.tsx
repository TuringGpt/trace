import clsx from 'clsx';
import { ChangeEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import successIcon from '../../../assets/success.svg';
import { hideBusyIndicator, showBusyIndicator } from '../store/actions';
import useAppState from '../store/hook';
import { DialogType } from '../../types/customTypes';
import {
  UPLOAD_CONSENT_MESSAGE,
  UPLOAD_SUCCESS_MESSAGE,
  SELECT_FILE_ERROR,
  INVALID_FILE_TYPE_ERROR,
  UPLOAD_FAILURE_ERROR,
  OK_POPUP_BUTTON,
  ERROR_POPUP_TITLE,
  AGREE_POPUP_BUTTON,
  ABORT_POPUP_BUTTON,
  INFO_POPUP_TITLE,
} from '../../constants';

import { useDialog } from '../hooks/useDialog';

function FileUploadSuccess() {
  const navigate = useNavigate();
  const onClose = () => {
    navigate('/');
  };
  return (
    <div className="flex flex-col items-center space-y-4">
      <div
        id="uploadSuccessOverlay"
        className="p-4 rounded-lg w-1/2 h-1/2 max-w-2xl max-h-md flex flex-col justify-evenly"
      >
        <img src={successIcon} alt="Upload Successful" className="h-40" />
        <div>
          <h1 className="text-xl flex justify-center font-sans text-center mt-8">
            {UPLOAD_SUCCESS_MESSAGE}
          </h1>
          <span
            id="uploadedZipFileName"
            className="text-white flex justify-center mt-4 text-center text-sm mr-4"
          />
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        id="closeUploadModalBtn"
        className="bg-green-600 rounded-md px-4 py-3 text-white"
      >
        Back
      </button>
    </div>
  );
}

export default function Upload() {
  const [uploadInputFile, setUploadInputFile] = useState({
    name: '',
    filePath: '',
  });
  const [isUploadSuccess, setIsUploadSuccess] = useState(false);
  const navigate = useNavigate();
  const { dispatch } = useAppState();

  const { showDialog } = useDialog();

  const onInputFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) {
      await showDialog(ERROR_POPUP_TITLE, SELECT_FILE_ERROR, {
        type: DialogType.Error,
        buttons: [OK_POPUP_BUTTON],
      });
      return;
    }
    if (selectedFile.type !== 'application/zip') {
      await showDialog(ERROR_POPUP_TITLE, INVALID_FILE_TYPE_ERROR, {
        type: DialogType.Error,
        buttons: [OK_POPUP_BUTTON],
      });
      return;
    }

    setUploadInputFile({
      name: selectedFile.name,
      filePath: selectedFile.path,
    });
  };

  const onStartUploadClick = async () => {
    const consent = await showDialog(INFO_POPUP_TITLE, UPLOAD_CONSENT_MESSAGE, {
      type: DialogType.Confirmation,
      buttons: [AGREE_POPUP_BUTTON, ABORT_POPUP_BUTTON],
    });
    if (!consent.success) return;

    dispatch(showBusyIndicator('Uploading files...'));
    const response = await window.electron.uploadFiles(
      uploadInputFile.filePath,
    );
    setUploadInputFile({ name: '', filePath: '' });
    if (response.status === 'success') {
      dispatch(hideBusyIndicator());
      setIsUploadSuccess(true);
    } else {
      await showDialog(ERROR_POPUP_TITLE, UPLOAD_FAILURE_ERROR, {
        type: DialogType.Error,
        buttons: [OK_POPUP_BUTTON],
      });
      dispatch(hideBusyIndicator());
    }
  };
  if (isUploadSuccess) {
    return <FileUploadSuccess />;
  }
  return (
    <div
      id="uploadOverlay"
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
    >
      <div
        id="uploadModal"
        className="bg-slate-900 relative p-4 rounded-lg border border-gray-700 w-1/2 h-1/2 max-w-2xl max-h-md flex flex-col justify-evenly"
      >
        <h2 className="text-3xl text-white text-center">Upload</h2>
        <div className="flex flex-col items-center space-y-16">
          <div>
            <span id="zipFileInputName" className="text-white ml-2">
              {uploadInputFile.name}
            </span>
            <label
              htmlFor="zipFileInput"
              className="bg-indigo-600 text-white rounded-md px-4 py-3 cursor-pointer"
            >
              Choose Zip File
              <input
                type="file"
                id="zipFileInput"
                className="hidden"
                onChange={onInputFileChange}
                accept=".zip"
              />
            </label>
          </div>
          <button
            type="button"
            id="startUploadBtn"
            disabled={!uploadInputFile.name}
            onClick={onStartUploadClick}
            className={clsx('bg-green-600 rounded-md px-4 py-3 text-white', {
              'opacity-50': !uploadInputFile.name,
            })}
          >
            Start Upload
          </button>
        </div>
        <div className="flex absolute justify-end top-10 right-10">
          <button
            type="button"
            id="closeUploadModalBtn"
            onClick={() => navigate('/')}
            className="text-white"
          >
            &#10005;
          </button>
        </div>
      </div>
    </div>
  );
}
