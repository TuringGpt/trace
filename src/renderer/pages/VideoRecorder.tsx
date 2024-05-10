import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CapturedSource, DialogType } from '../../types/customTypes';
import { hideBusyIndicator, setRecordingName, showBusyIndicator } from '../store/actions';
import useAppState from '../store/hook';
import { formatTimeInHHMMSS } from '../util/timeFormat';
import log from '../util/logger';
import { INITIAL_CONSENT_TEXT, RECORDING_STARTED_LOG, RECORDING_STOPPED_LOG, NO_STREAM_FOUND_LOG, ERROR_VIDEO_SAVING_LOG, VIDEO_CONVERSION_INDICATOR, CHOOSE_VIDEO_SOURCE_TEXT, SELECT_SOURCE_TEXT } from '../../constants';

export default function VideoRecorder() {
  const [source, setSource] = useState<CapturedSource | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const videoPlaceholderRef = useRef<HTMLDivElement>(null);

  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const { dispatch } = useAppState();
  const navigate = useNavigate();

  useEffect(() => {
    const cleanup = window.electron.onSelectVideoSource((selectedSource) => {
      log.info('source selected callback ', selectedSource);
      setSource(selectedSource);
    });
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

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((time) => time + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
      if (interval) clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const onStartRecording = async () => {
    const consent = await window.electron.showDialog('info', INITIAL_CONSENT_TEXT, {
      type: DialogType.Confirmation,
      buttons: ['Agree', 'Abort'],
    });
    if (!consent?.data) {
      return;
    }
    setIsRecording(true);
    log.info(RECORDING_STARTED_LOG);
    const videoElement = videoRef.current;
    const stream = videoElement?.srcObject as MediaStream;
    if (!stream) {
      log.error(NO_STREAM_FOUND_LOG);
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
      log.info(RECORDING_STOPPED_LOG, chunks.length);
      dispatch(showBusyIndicator(VIDEO_CONVERSION_INDICATOR));
      const blob = new Blob(chunks, { type: 'video/webm; codecs=H264' });
      const arrayBuffer = await blob.arrayBuffer();
      const res = await window.electron.stopRecording(new Uint8Array(arrayBuffer));
      setIsRecording(false);
      if (res.status === 'error') {
        log.error(ERROR_VIDEO_SAVING_LOG, {
          remuxRes: res,
        });
        return;
      }

      dispatch(hideBusyIndicator());
      dispatch(setRecordingName(res.data.recordingFolderName));
      navigate('/save-zip');
    };
    recorder.start();
    window.electron.startNewRecording();
  };

  const onStopRecording = () => {
    log.info(RECORDING_STOPPED_LOG, mediaRecorder?.state);
    if (mediaRecorder?.state === 'recording') {
      mediaRecorder.stop();
      setMediaRecorder(null);
      window.electron.mediaRecordingStopped();
    }
  };

  return (
    <div>
      <div className="flex justify-center">
        <button
          id="videoSelectBtn"
          type="button"
          onClick={async () => {
            await window.electron.getVideoSources();
          }}
          className="bg-slate-600 m-6 mb-0 rounded-full px-4 py-2 text-white"
        >
          {source?.name || CHOOSE_VIDEO_SOURCE_TEXT}
        </button>
      </div>

      <div className="flex justify-center m-6 px-4 py-2 max-h-[calc(100vh-450px)]">
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
          {SELECT_SOURCE_TEXT}
        </div>
      </div>

      <div className="flex justify-center space-x-2">
        <div
          className={clsx('recording-dot', {
            'is-recording': isRecording,
          })}
        />
        <span id="recordingTime" className="text-2xl">
          {formatTimeInHHMMSS(recordingTime)}
        </span>
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
    </div>
  );
}
