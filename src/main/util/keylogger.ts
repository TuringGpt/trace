import { uIOhook } from 'uiohook-napi';
import throttle from '../../renderer/util/throttle';
import keycodesMapping from './keycodes';

class KeyLogger {
  isLogging: boolean;

  logEntries: Set<string>;

  startTime: number | undefined;

  lastMouseLogTime: number;

  mouseLogInterval: number;

  scrollLogInterval: number;

  constructor() {
    this.isLogging = false;
    this.logEntries = new Set<string>();
    this.lastMouseLogTime = 0;
    this.mouseLogInterval = 50;
    this.scrollLogInterval = 50;
  }

  startLogging() {
    // #todo: use e.time instead of Date.now()
    if (this.isLogging) return;
    this.isLogging = true;
    this.startTime = Date.now();

    const getFormattedTime = (now: number) => {
      const time = now - (this.startTime ?? 0);
      const milliseconds = time % 1000;
      const seconds = Math.floor((time / 1000) % 60);
      const minutes = Math.floor((time / (1000 * 60)) % 60);
      const hours = Math.floor((time / (1000 * 60 * 60)) % 24);

      const fHours = hours < 10 ? `0${hours}` : hours;
      const fMinutes = minutes < 10 ? `0${minutes}` : minutes;
      const fSeconds = seconds < 10 ? `0${seconds}` : seconds;
      const fMilliseconds = milliseconds.toString().padStart(3, '0');

      return `${fHours}:${fMinutes}:${fSeconds}.${fMilliseconds}`;
    };

    const addKeyboardLogEntry = (e: any) => {
      const now = Date.now();
      const timestamp = getFormattedTime(now);
      this.logEntries.add(
        `${timestamp}: Keyboard Button Press : ${keycodesMapping[e.keycode]}`,
      );
    };

    const addMouseLogEntry = (e: any) => {
      const now = Date.now();
      const timestamp = getFormattedTime(now);
      this.logEntries.add(`${timestamp}: Mouse Button ${e.type} : ${e.button}`);
    };

    const addMouseMoveLogEntry = throttle((e: any) => {
      const now = Date.now();
      const timestamp = getFormattedTime(now);
      this.logEntries.add(`${timestamp}: Mouse moved to X:${e.x}, Y:${e.y}`);
    }, this.mouseLogInterval);

    const addScrollLogEntry = throttle((e: any) => {
      const now = Date.now();
      const timestamp = getFormattedTime(now);
      const axis = e.direction === 3 ? 'Vertical' : 'Horizontal';
      const direction = e.rotation > 0 ? 'UP' : 'DOWN';
      const intensity = e.rotation < 0 ? e.rotation * -1 : e.rotation;
      this.logEntries.add(
        `${timestamp}: Scrolled ${axis}, Direction: ${direction}, Intensity: ${intensity}`,
      );
    }, this.scrollLogInterval);

    uIOhook.on('keyup', addKeyboardLogEntry);
    uIOhook.on('mousedown', addMouseLogEntry);
    uIOhook.on('mouseup', addMouseLogEntry);
    uIOhook.on('mousemove', addMouseMoveLogEntry);
    uIOhook.on('wheel', addScrollLogEntry);

    uIOhook.start();
  }

  stopLogging(): string | null {
    this.isLogging = false;
    uIOhook.removeAllListeners();
    uIOhook.stop();
    const logContent = Array.from(this.logEntries).join('\n');
    this.logEntries.clear();
    return logContent;
  }
}

export default new KeyLogger();
