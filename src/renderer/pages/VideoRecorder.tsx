/* eslint-disable jsx-a11y/media-has-caption */
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  CHOOSE_VIDEO_SOURCE_TEXT,
  INITIAL_CONSENT_TEXT,
  ROUTE_VIDEO,
  SELECT_SOURCE_TEXT,
  VIDEO_CONVERSION_INDICATOR,
  INFO_POPUP_TITLE,
  AGREE_POPUP_BUTTON,
  ABORT_POPUP_BUTTON,
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

const xboxButtonMapping = [
  'A',
  'B',
  'X',
  'Y',
  'Left Bumper',
  'Right Bumper',
  'Left Trigger',
  'Right Trigger',
  'Back',
  'Start',
  'Left Stick (Press)',
  'Right Stick (Press)',
  'D-Pad Up',
  'D-Pad Down',
  'D-Pad Left',
  'D-Pad Right',
  'Guide Button',
];

const playStationButtonMapping = [
  'Cross (X)',
  'Circle (O)',
  'Square',
  'Triangle',
  'Left Bumper (L1)',
  'Right Bumper (R1)',
  'Left Trigger (L2)',
  'Right Trigger (R2)',
  'Share',
  'Options',
  'Left Stick (Press)',
  'Right Stick (Press)',
  'D-Pad Up',
  'D-Pad Down',
  'D-Pad Left',
  'D-Pad Right',
  'PlayStation (PS)',
  'Touchpad',
];

const genericButtonMapping = Array.from(
  { length: 16 },
  (_, i) => `Button ${i}`,
);

interface AxesLogTimers {
  [key: string]: {
    [index: number]: boolean;
  };
}

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

  const loggedControllers = useRef<Set<string>>(new Set());
  const axesLogTimers = useRef<AxesLogTimers>({});

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

  useEffect(() => {
    const previousGamepadState: any[] = [];
    const previousAxesState: any[] = [];

    const getButtonName = (gamepad: Gamepad, index: number) => {
      if (gamepad.id.toLowerCase().includes('xbox'))
        return xboxButtonMapping[index] || `Button ${index}`;
      if (gamepad.id.toLowerCase().includes('playstation'))
        return playStationButtonMapping[index] || `Button ${index}`;
      return genericButtonMapping[index];
    };

    function updateGamepadStatus() {
      const gamepads = navigator.getGamepads();
      for (let i = 0; i < gamepads.length; i += 1) {
        const gamepad = gamepads[i];
        // eslint-disable-next-line no-continue
        if (!gamepad) continue;

        // Log the type of controller once
        if (!loggedControllers.current.has(gamepad.id)) {
          if (gamepad.id.toLowerCase().includes('xbox')) {
            log.info('Xbox Controller connected');
          } else if (gamepad.id.toLowerCase().includes('playstation')) {
            log.info('PlayStation Controller connected');
          } else {
            log.info('Generic Controller connected');
          }
          loggedControllers.current.add(gamepad.id);
        }

        if (!previousGamepadState[i]) {
          previousGamepadState[i] = gamepad.buttons.map(
            (button) => button.pressed,
          );
        }
        if (!previousAxesState[i]) {
          previousAxesState[i] = gamepad.axes.slice();
        }

        gamepad.buttons.forEach((button, index) => {
          const isPressed = button.pressed;
          const wasPressed = previousGamepadState[i][index];
          const buttonName = getButtonName(gamepad, index);

          if (isPressed && !wasPressed) {
            window.electron.logGamepadButton(buttonName, button.value, true);
          }
          if (!isPressed && wasPressed) {
            window.electron.logGamepadButton(buttonName, button.value, false);
          }

          previousGamepadState[i][index] = isPressed;
        });

        const threshold = 0.9;

        for (let index = 0; index < gamepad.axes.length; index += 1) {
          const newAxisValue = gamepad.axes[index];
          const oldAxisValue = previousAxesState[i][index];

          if (Math.abs(newAxisValue - oldAxisValue) > threshold) {
            window.electron.logGamepadAxis(index, newAxisValue);
            previousAxesState[i][index] = newAxisValue;
          }
        }
      }
      requestAnimationFrame(updateGamepadStatus);
    }

    window.addEventListener('gamepadconnected', () =>
      requestAnimationFrame(updateGamepadStatus),
    );
    window.addEventListener('gamepaddisconnected', (event) => {
      log.info('Gamepad disconnected');
      const { gamepad } = event;
      if (axesLogTimers.current[gamepad.id]) {
        delete axesLogTimers.current[gamepad.id];
      }
    });

    if (navigator.getGamepads()[0]) requestAnimationFrame(updateGamepadStatus);
  }, []);

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
      mimeType: 'video/webm; codecs=H264',
      bitsPerSecond: 8000000,
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
      log.info('Recording stopped', chunks.length);
      dispatch(showBusyIndicator(VIDEO_CONVERSION_INDICATOR));
      const blob = new Blob(chunks, { type: 'video/webm; codecs=H264' });
      const arrayBuffer = await blob.arrayBuffer();
      const res = await window.electron.stopRecording(
        new Uint8Array(arrayBuffer),
        recordingStopTime === null ? Date.now() : recordingStopTime,
      );
      setIsRecording(false);
      if (res.status === 'error') {
        log.error('Error during video saving', {
          remuxRes: res,
        });
        return;
      }

      dispatch(hideBusyIndicator());
      dispatch(setRecordingName(res.data.recordingFolderName));

      navigate(ROUTE_VIDEO);
    };
    recorder.start();
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
