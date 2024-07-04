import {
  uIOhook,
  UiohookKeyboardEvent,
  UiohookMouseEvent,
  UiohookWheelEvent,
} from 'uiohook-napi';

import throttle from '../../renderer/util/throttle';
import keycodesMapping from './keycodes';
import logger from './logger';

const log = logger.child({ module: 'util.keylogger' });

class KeyLogger {
  isLogging: boolean;

  logEntries: string[];

  uniqueKeys: Set<string>;

  startTime: number;

  stopTime: number;

  lastMouseLogTime: number;

  mouseLogInterval: number;

  scrollLogInterval: number;

  constructor() {
    this.isLogging = false;
    this.logEntries = [];
    this.uniqueKeys = new Set();
    this.lastMouseLogTime = 0;
    this.mouseLogInterval = 50;
    this.scrollLogInterval = 50;
    this.startTime = 0;
    this.stopTime = Infinity;
  }

  startLogging() {
    if (this.isLogging) return;
    this.isLogging = true;
    this.startTime = Date.now();

    log.info('Starting keylogging');

    uIOhook.on('keydown', this.logKeyDown);
    uIOhook.on('keyup', this.logKeyUp);
    uIOhook.on('mousedown', this.logMouseDown);
    uIOhook.on('mouseup', this.logMouseUp);
    uIOhook.on('mousemove', throttle(this.logMouseMove, this.mouseLogInterval));
    uIOhook.on('wheel', throttle(this.logScroll, this.scrollLogInterval));

    uIOhook.start();
  }

  logKeyDown = (e: UiohookKeyboardEvent) => {
    if (Date.now() > this.stopTime) return;
    const timestamp = this.getFormattedTime();
    const key = keycodesMapping[e.keycode];
    this.logEntries.push(`${timestamp}: Keyboard Button Press : ${key}`);
    this.uniqueKeys.add(key);
  };

  logKeyUp = (e: UiohookKeyboardEvent) => {
    if (Date.now() > this.stopTime) return;
    const timestamp = this.getFormattedTime();
    const key = keycodesMapping[e.keycode];
    this.logEntries.push(`${timestamp}: Keyboard Button Release : ${key}`);
  };

  logMouseDown = (e: UiohookMouseEvent) => {
    if (Date.now() > this.stopTime) return;
    const timestamp = this.getFormattedTime();
    const button = `Mouse Button ${e.button}`;
    this.logEntries.push(`${timestamp}: Mouse Button Press : ${button}`);
    this.uniqueKeys.add(button);
  };

  logMouseUp = (e: UiohookMouseEvent) => {
    if (Date.now() > this.stopTime) return;
    const timestamp = this.getFormattedTime();
    const button = `Mouse Button ${e.button}`;
    this.logEntries.push(`${timestamp}: Mouse Button Release : ${button}`);
  };

  logMouseMove = (e: UiohookMouseEvent) => {
    if (Date.now() > this.stopTime) return;
    const timestamp = this.getFormattedTime();
    this.logEntries.push(`${timestamp}: Mouse moved to X:${e.x}, Y:${e.y}`);
  };

  logScroll = (e: UiohookWheelEvent) => {
    if (Date.now() > this.stopTime) return;
    const timestamp = this.getFormattedTime();
    const axis = e.direction === 3 ? 'Vertical' : 'Horizontal';
    let direction;
    if (axis === 'Vertical') {
      direction = e.rotation > 0 ? 'UP' : 'DOWN';
    } else {
      direction = e.rotation > 0 ? 'LEFT' : 'RIGHT';
    }
    this.logEntries.push(
      `${timestamp}: Mouse Scrolled ${axis}, Direction: ${direction}, Intensity: ${
        e.rotation < 0 ? e.rotation * -1 : e.rotation
      }`,
    );
  };

  logGamepadButton = (buttonName: string, value: number, pressed: boolean) => {
    const timestamp = this.getFormattedTime();
    const action = pressed ? 'Press' : 'Release';
    const entry = `${timestamp}: Gamepad Button ${action}: ${buttonName}, Value: ${Math.abs(value).toFixed(2)}`;
    if (
      !this.logEntries.length ||
      entry !== this.logEntries[this.logEntries.length - 1]
    ) {
      this.logEntries.push(entry);
    }
  };

  logGamepadAxis = (axisIndex: number, value: number) => {
    const axisNames: { [key: number]: string } = {
      0: 'Left Stick X',
      1: 'Left Stick Y',
      2: 'Right Stick X',
      3: 'Right Stick Y',
      4: 'Left Trigger',
      5: 'Right Trigger',
    };
    const timestamp = this.getFormattedTime();
    const axisName = axisNames[axisIndex] || `Axis ${axisIndex}`;
    let direction;
    if (axisName.includes('X')) {
      direction = value > 0 ? 'RIGHT' : 'LEFT';
    } else if (axisName.includes('Y')) {
      direction = value > 0 ? 'DOWN' : 'UP';
    } else {
      direction = value > 0 ? 'POSITIVE' : 'NEGATIVE';
    }
    const intensity = Math.abs(value).toFixed(2);
    const entry = `${timestamp}: Gamepad Axis: ${axisName}, Movement: ${direction}, Intensity: ${intensity}`;
    if (
      !this.logEntries.length ||
      entry !== this.logEntries[this.logEntries.length - 1]
    ) {
      this.logEntries.push(entry);
    }
  };

  getFormattedTime() {
    const time = Date.now() - this.startTime;
    const milliseconds = time % 1000;
    const seconds = Math.floor((time / 1000) % 60);
    const minutes = Math.floor((time / (1000 * 60)) % 60);
    const hours = Math.floor((time / (1000 * 60 * 60)) % 24);

    const fHours = hours < 10 ? `0${hours}` : hours;
    const fMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const fSeconds = seconds < 10 ? `0${seconds}` : seconds;
    const fMilliseconds = milliseconds.toString().padStart(3, '0');

    return `${fHours}:${fMinutes}:${fSeconds}:${fMilliseconds}`;
  }

  getUniqueKeys() {
    const uniqueKeys = Array.from(this.uniqueKeys);
    this.uniqueKeys.clear();
    return uniqueKeys;
  }

  stopLogging(recordingStopTime: number): string | null {
    if (!this.isLogging) return null;

    log.info('Keylogging being stopped');
    this.stopTime = recordingStopTime;
    this.isLogging = false;
    uIOhook.removeAllListeners();
    uIOhook.stop();
    const logContent = this.logEntries.join('\n');
    this.logEntries = [];
    this.stopTime = Infinity;
    return logContent;
  }
}

export default new KeyLogger();
