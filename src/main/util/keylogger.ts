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

    try {
      uIOhook.on('keydown', this.logKeyDown);
      uIOhook.on('keyup', this.logKeyUp);
      uIOhook.on('mousedown', this.logMouseDown);
      uIOhook.on('mouseup', this.logMouseUp);
      uIOhook.on(
        'mousemove',
        throttle(this.logMouseMove, this.mouseLogInterval),
      );
      uIOhook.on('wheel', throttle(this.logScroll, this.scrollLogInterval));
      uIOhook.start();
    } catch (error) {
      log.error('Error starting keylogging', error);
      this.isLogging = false;
    }
  }

  logKeyDown = (e: UiohookKeyboardEvent) => {
    try {
      if (Date.now() > this.stopTime) return;
      const timestamp = this.getFormattedTime();
      const key = keycodesMapping[e.keycode];
      this.logEntries.push(`${timestamp}: Keyboard Button Press : ${key}`);
      this.uniqueKeys.add(key);
    } catch (error) {
      log.error('Error logging key down', error);
    }
  };

  logKeyUp = (e: UiohookKeyboardEvent) => {
    try {
      if (Date.now() > this.stopTime) return;
      const timestamp = this.getFormattedTime();
      const key = keycodesMapping[e.keycode];
      this.logEntries.push(`${timestamp}: Keyboard Button Release : ${key}`);
    } catch (error) {
      log.error('Error logging key up', error);
    }
  };

  logMouseDown = (e: UiohookMouseEvent) => {
    try {
      if (Date.now() > this.stopTime) return;
      const timestamp = this.getFormattedTime();
      const button = `Mouse Button ${e.button}`;
      this.logEntries.push(`${timestamp}: Mouse Button Press : ${button}`);
      this.uniqueKeys.add(button);
    } catch (error) {
      log.error('Error logging mouse down', error);
    }
  };

  logMouseUp = (e: UiohookMouseEvent) => {
    try {
      if (Date.now() > this.stopTime) return;
      const timestamp = this.getFormattedTime();
      const button = `Mouse Button ${e.button}`;
      this.logEntries.push(`${timestamp}: Mouse Button Release : ${button}`);
    } catch (error) {
      log.error('Error logging mouse up', error);
    }
  };

  logMouseMove = (e: UiohookMouseEvent) => {
    try {
      if (Date.now() > this.stopTime) return;
      const timestamp = this.getFormattedTime();
      this.logEntries.push(`${timestamp}: Mouse moved to X:${e.x}, Y:${e.y}`);
    } catch (error) {
      log.error('Error logging mouse move', error);
    }
  };

  logScroll = (e: UiohookWheelEvent) => {
    try {
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
    } catch (error) {
      log.error('Error logging scroll', error);
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
    try {
      uIOhook.removeAllListeners();
      uIOhook.stop();
    } catch (error) {
      log.error('Error stopping keylogging', error);
    }
    const logContent = this.logEntries.join('\n');
    this.logEntries = [];
    this.stopTime = Infinity;
    return logContent;
  }
}

export default new KeyLogger();
