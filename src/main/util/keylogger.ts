import { uIOhook } from 'uiohook-napi';

import throttle from '../../renderer/util/throttle';
import keycodesMapping from './keycodes';

class KeyLogger {
  isLogging: boolean;

  logEntries: string[];

  startTime: number | undefined;

  lastMouseLogTime: number;

  mouseLogInterval: number;

  scrollLogInterval: number;

  constructor() {
    this.isLogging = false;
    this.logEntries = [];
    this.lastMouseLogTime = 0;
    this.mouseLogInterval = 50;
    this.scrollLogInterval = 50;
  }

  startLogging() {
    if (this.isLogging) return;
    this.isLogging = true;
    this.startTime = Date.now();

    uIOhook.on('keydown', (e) => {
      const timestamp = this.getFormattedTime();
      this.logEntries.push(
        `${timestamp}: Keyboard Button Press : ${keycodesMapping[e.keycode]}`,
      );
    });

    uIOhook.on('mousedown', (e) => {
      const timestamp = this.getFormattedTime();
      this.logEntries.push(`${timestamp}: Mouse Button Press : ${e.button}`);
    });

    uIOhook.on('mouseup', (e) => {
      const timestamp = this.getFormattedTime();
      this.logEntries.push(`${timestamp}: Mouse Button Release : ${e.button}`);
    });

    const throttledMouseMove = throttle((e) => {
      const timestamp = this.getFormattedTime();
      this.logEntries.push(`${timestamp}: Mouse moved to X:${e.x}, Y:${e.y}`);
    }, this.mouseLogInterval);

    uIOhook.on('mousemove', throttledMouseMove);

    const logScroll = throttle((e) => {
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
    }, this.scrollLogInterval);

    uIOhook.on('wheel', logScroll);

    uIOhook.start();
  }

  getFormattedTime() {
    // this is to satisfy typescript, startTime is always defined when isLogging is true
    const time = Date.now() - (this.startTime ?? 0);
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
    this.isLogging = false;
    uIOhook.removeAllListeners();
    uIOhook.stop();
    const logContent = this.logEntries.join('\n');
    this.logEntries = [];
    return logContent;
  }
}

export default new KeyLogger();
