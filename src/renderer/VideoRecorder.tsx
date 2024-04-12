import clsx from 'clsx';
import { DesktopCapturerSource } from 'electron';
import { useEffect, useRef, useState } from 'react';

import FileOptions from './FileOptions';

export default function VideoRecorder() {
  const [source, setSource] = useState<DesktopCapturerSource | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const videoPlaceholderRef = useRef<HTMLDivElement>(null);

  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );

  const [zipFileDetails, setZipFileDetails] = useState<{
    zipFilePath: string;
    zipFileName: string;
  } | null>(null);

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
    console.log('Recording started');
    const videoElement = videoRef.current;
    const stream = videoElement?.srcObject as MediaStream;
    if (!stream) {
      console.error('No stream found');
      return;
    }
    const options = {
      mimeType: 'video/webm; codecs=H264',
      bitsPerSecond: 3000000,
    };
    const recorder = new MediaRecorder(stream, options);
    setMediaRecorder(recorder);

    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    recorder.onstop = async () => {
      console.log('Recording stopped', chunks.length);
      const blob = new Blob(chunks, { type: 'video/webm; codecs=H264' });

      const arrayBuffer = await blob.arrayBuffer();
      // do this later
      // const { keyLogFilePath } = await electronAPI.stopKeystrokesLogging();
      // const { metadataFilePath } = await electronAPI.getDeviceMetadata(screenId);
      const keyLogFilePath = '';
      const metadataFilePath = '';
      const res = await window.electron.ipcRenderer.remuxVideoFile(
        new Uint8Array(arrayBuffer),
      );
      console.log(res);
      // handle the response
      setIsRecording(false);
      const { videoFilePath } = res;
      const { zipFilePath, zipFileName } =
        await window.electron.ipcRenderer.createZipFile(
          videoFilePath,
          keyLogFilePath,
          metadataFilePath,
        );
      console.log(zipFilePath, zipFileName);
      setZipFileDetails({ zipFilePath, zipFileName });
    };
    recorder.start();
  };

  const onStopRecording = () => {
    console.log('Recording stopped', mediaRecorder?.state);
    if (mediaRecorder?.state === 'recording') {
      mediaRecorder.stop();
      setMediaRecorder(null);
    }
  };

  return (
    <div>
      {zipFileDetails && (
        <FileOptions
          zipFileName={zipFileDetails.zipFileName}
          zipFilePath={zipFileDetails.zipFilePath}
        />
      )}
      {!zipFileDetails && (
        <>
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
              className={clsx({
                hidden: !source,
              })}
            />
            <div
              id="videoPlaceholder"
              ref={videoPlaceholderRef}
              className={clsx(
                `flex items-center justify-center py-20 w-full text-2xl text-indigo-600`,
                {
                  hidden: source,
                },
              )}
            >
              Please select a source to proceed.
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              id="startButton"
              className={clsx(
                `bg-indigo-600 m-6 mb-0 rounded-md px-4 py-4 text-white`,
                {
                  'opacity-50': !source || isRecording,
                },
              )}
              disabled={!source || isRecording}
              ref={startButtonRef}
              onClick={onStartRecording}
            >
              Start
            </button>
            <button
              type="button"
              id="stopButton"
              className={clsx(
                'bg-red-600 m-6 mb-0 rounded-md px-4 py-4 text-white',
                {
                  'opacity-50': !isRecording,
                },
              )}
              disabled={!isRecording}
              onClick={onStopRecording}
            >
              Stop
            </button>
          </div>
        </>
      )}
    </div>
  );
}
