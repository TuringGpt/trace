import { useEffect, useState } from 'react';
import { IoVideocam } from 'react-icons/io5';

export default function Thumbnail({ videoId }: { videoId: string }) {
  const [videoServerPort, setVideoServerPort] = useState(-1);
  const [error, setError] = useState<null | boolean>(null);

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
