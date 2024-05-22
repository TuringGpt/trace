import { useEffect, useState } from 'react';
import { IoVideocam } from 'react-icons/io5';
import { useDialog } from '../hooks/useDialog';
import { DialogType } from '../../types/customTypes';
import {
  ERROR_POPUP_TITLE,
  OK_POPUP_BUTTON,
  VIDEO_RETRIEVE_ERROR_POPUP_MESSAGE,
} from '../../constants';

export default function Thumbnail({ videoId }: { videoId: string }) {
  const [videoServerPort, setVideoServerPort] = useState(-1);
  const [error, setError] = useState<null | boolean>(null);
  const { showDialog } = useDialog();

  useEffect(() => {
    const fetchVideoServerPort = async () => {
      const portRes = await window.electron.getVideoStreamingPort();
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
  if (videoServerPort === -1) {
    return null;
  }
  return (
    <div className="w-full h-44 bg-gray-600 flex items-center justify-center text-white">
      {(error == null || error === false) && (
        <img
          src={`http://localhost:${videoServerPort}/thumbnails/${videoId}`}
          alt="Thumbnail"
          className="object-fill w-full h-full"
          onError={() => {
            setError(true);
          }}
        />
      )}
      {error && <IoVideocam size={32} />}
    </div>
  );
}
