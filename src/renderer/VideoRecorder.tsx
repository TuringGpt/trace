import { DesktopCapturerSource } from 'electron';
import { useEffect, useRef, useState } from 'react';

export default function VideoRecorder() {
  const [source, setSource] = useState<DesktopCapturerSource | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const videoPlaceholderRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const cleanup = window.electron.ipcRenderer.onSelectVideoSource(
      (selectedSource) => {
        console.log(selectedSource);
        setSource(selectedSource);
      },
    );
    return cleanup;
  }, []);

  useEffect(() => {
    if (source) {
      const playVideo = async () => {
        const videoElement = videoRef.current;
        const videoPlaceholder = videoPlaceholderRef.current;
        const startButton = startButtonRef.current;
        if (videoElement && videoPlaceholder && startButton) {
          videoElement.srcObject = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id,
              },
            } as any,
          });
          videoElement.play();

          startButton.disabled = false;
        }
      };
      playVideo();
    }
  }, [source]);

  const onStartRecording = async () => {
    setIsRecording(true);
  };

  return (
    <div>
      <div className="flex justify-center">
        <button
          id="videoSelectBtn"
          type="button"
          onClick={async () => {
            await window.electron.ipcRenderer.getVideoSources();
          }}
          className="bg-slate-600 m-6 mb-0 rounded-full px-4 py-2 text-white"
        >
          Choose a Video Source
        </button>
      </div>

      <div className="flex justify-center m-6 px-4 py-2 max-h-[calc(100vh-450px)]">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          id="videoElement"
          ref={videoRef}
          className={source ? '' : 'hidden'}
        />
        <div
          id="videoPlaceholder"
          ref={videoPlaceholderRef}
          className={`flex items-center justify-center py-20 w-full text-2xl text-indigo-600 ${
            source ? 'hidden' : ''
          }`}
        >
          Please select a source to proceed.
        </div>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          id="startButton"
          className={`bg-indigo-600 m-6 mb-0 rounded-md px-4 py-4 text-white opacity-50 ${
            source ? 'opacity-100' : 'opacity-50'
          }`}
          disabled
          ref={startButtonRef}
          onClick={onStartRecording}
        >
          Start
        </button>
        <button
          type="button"
          id="stopButton"
          className="bg-red-600 m-6 mb-0 rounded-md px-4 py-4 text-white opacity-50"
          disabled={!isRecording}
        >
          Stop
        </button>
      </div>
    </div>
  );
}
