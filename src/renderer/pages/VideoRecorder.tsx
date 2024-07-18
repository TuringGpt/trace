/* eslint-disable jsx-a11y/media-has-caption */
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  ABORT_POPUP_BUTTON,
  AGREE_POPUP_BUTTON,
  CHOOSE_VIDEO_SOURCE_TEXT,
  INFO_POPUP_TITLE,
  INITIAL_CONSENT_TEXT,
  ROUTE_VIDEO,
  SELECT_SOURCE_TEXT,
  VIDEO_CONVERSION_INDICATOR,
} from '../../constants';
import { CapturedSource, DialogType } from '../../types/customTypes';
import {
  hideBusyIndicator,
  setRecordingName,
  showBusyIndicator,
} from '../store/actions';
import useAppState from '../store/hook';
import log from '../util/logger';
import { formatTimeInHHMMSS } from '../util/timeFormat';

import { useDialog } from '../hooks/useDialog';

let recordingStopTime: number | null = null;

export default function VideoRecorder() {
  const [source, setSource] = useState<CapturedSource | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const videoPlaceholderRef = useRef<HTMLDivElement>(null);

  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );
  const { dispatch } = useAppState();
  const navigate = useNavigate();

  const { showDialog } = useDialog();

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
          try {
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
          } catch (err) {
            log.error('Error loading recording preview', err);
            throw err;
          }
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
    const consent = await showDialog(INFO_POPUP_TITLE, INITIAL_CONSENT_TEXT, {
      type: DialogType.Confirmation,
      buttons: [AGREE_POPUP_BUTTON, ABORT_POPUP_BUTTON],
    });
    if (!consent.success) {
      return;
    }
    setIsRecording(true);
    log.info('Recording started');
    const videoElement = videoRef.current;
    const stream = videoElement?.srcObject as MediaStream;
    if (!stream) {
      log.error('No stream found');
      return;
    }
    const options = {
      mimeType: 'video/webm; codecs=vp9',
      bitsPerSecond: 8000000,
    };
    const recorder = new MediaRecorder(stream, options);
    setMediaRecorder(recorder);

    const chunks: Blob[] = [];
    recorder.ondataavailable = async (event) => {
      if (event.data.size > 0) {
        const arrayBuffer = await event.data.arrayBuffer();
        window.electron.saveChunks(new Uint8Array(arrayBuffer));
      }
    };

    recorder.onstop = async () => {
      log.info('Recording stopped', chunks.length);
      dispatch(showBusyIndicator(VIDEO_CONVERSION_INDICATOR));

      try {
        const res = await window.electron.stopRecording(
          recordingStopTime === null ? Date.now() : recordingStopTime,
        );
        setIsRecording(false);
        if (res.status === 'error') {
          log.error('Error during video saving', {
            remuxRes: res,
          });
          throw new Error('Remuxing error');
        }

        dispatch(hideBusyIndicator());
        dispatch(setRecordingName(res.data.recordingFolderName));
        navigate(ROUTE_VIDEO);
      } catch (error: any) {
        log.error('Error during remuxing:', error);
        await showDialog(
          'Remuxing Error',
          'An error occurred during the video processing. Please try again.',
          {
            type: DialogType.Error,
            buttons: ['Close'],
          },
        );
        dispatch(hideBusyIndicator());
        dispatch(setRecordingName(error.recordingFolderName));
      }
    };
    recorder.start(5 * 1000); // Start saving records every 5 seconds
    window.electron.startNewRecording();
  };

  const onStopRecording = () => {
    recordingStopTime = Date.now();
    log.info('Recording stopped', mediaRecorder?.state);
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
            try {
              await window.electron.getVideoSources();
            } catch (err) {
              log.error('Error getting video sources', err);
              throw err;
            }
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
