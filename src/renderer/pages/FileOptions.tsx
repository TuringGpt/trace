import { useNavigate } from 'react-router-dom';

import useAppState from '../store/hook';

export default function FileOptions() {
  const { state } = useAppState();
  const navigate = useNavigate();
  const onSave = async () => {
    await window.electron.saveZipFile(
      state.zip.zipFileName,
      state.zip.zipFilePath,
    );
    navigate('/');
  };
  const onDiscard = async () => {
    // TODO: Implement discard functionality, we might have to delete the zip file
    navigate('/');
  };
  return (
    <div className="flex flex-col justify-center items-center">
      <div className="flex items-center justify-between w-full max-w-2xl rounded-lg border-[1px] border-indigo-600 m-4 mt-12 p-4">
        <span className="text-l ml-3">{state.zip.zipFileName}</span>
        <div className="flex items-center">
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
