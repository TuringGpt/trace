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

  startTime: number;

  lastMouseLogTime: number;

  mouseLogInterval: number;

  scrollLogInterval: number;

  constructor() {
    this.isLogging = false;
    this.logEntries = [];
    this.lastMouseLogTime = 0;
    this.mouseLogInterval = 50;
    this.scrollLogInterval = 50;
    this.startTime = 0;
  }

  startLogging() {
    if (this.isLogging) return;
    this.isLogging = true;
    this.startTime = Date.now();

    log.info('Starting keylogging');

    log.info('Starting keylogging');

    uIOhook.on('keyup', this.logKey);
    uIOhook.on('mousedown', this.logMouseDown);
    uIOhook.on('mouseup', this.logMouseUp);
    uIOhook.on('mousemove', throttle(this.logMouseMove, this.mouseLogInterval));
    uIOhook.on('wheel', throttle(this.logScroll, this.scrollLogInterval));

    uIOhook.start();
  }

  logKey = (e: UiohookKeyboardEvent) => {
    const timestamp = this.getFormattedTime();
    this.logEntries.push(
      `${timestamp}: Keyboard Button Press : ${keycodesMapping[e.keycode]}`,
    );
  };

  logMouseDown = (e: UiohookMouseEvent) => {
    const timestamp = this.getFormattedTime();
    this.logEntries.push(`${timestamp}: Mouse Button Press : ${e.button}`);
  };

  logMouseUp = (e: UiohookMouseEvent) => {
    const timestamp = this.getFormattedTime();
    this.logEntries.push(`${timestamp}: Mouse Button Release : ${e.button}`);
  };

  logMouseMove = (e: UiohookMouseEvent) => {
    const timestamp = this.getFormattedTime();
    this.logEntries.push(`${timestamp}: Mouse moved to X:${e.x}, Y:${e.y}`);
  };

  logScroll = (e: UiohookWheelEvent) => {
    const timestamp = this.getFormattedTime();
    const axis = e.direction === 3 ? 'Vertical' : 'Horizontal';
    let direction;
    if (axis === 'Vertical') {
      direction = e.rotation > 0 ? 'UP' : 'DOWN';
    } else {
      direction = e.rotation > 0 ? 'LEFT' : 'RIGHT';
    }
    this.logEntries.push(
      `${timestamp}: Scrolled ${axis}, Direction: ${direction}, Intensity: ${
        e.rotation < 0 ? e.rotation * -1 : e.rotation
      }`,
    );
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

  stopLogging(): string | null {
    if (!this.isLogging) return null;

    log.info('Keylogging being stopped');
    this.isLogging = false;
    uIOhook.removeAllListeners();
    uIOhook.stop();
    const logContent = this.logEntries.join('\n');
    this.logEntries = [];
    return logContent;
  }
}

export default new KeyLogger();
