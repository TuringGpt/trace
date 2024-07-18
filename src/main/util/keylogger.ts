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

  logEntries: { timestamp: number; entry: string }[];

  uniqueKeys: Set<string>;

  startTime: number;

  stopTime: number;

  lastMouseLogTime: number;

  mouseLogInterval: number;

  scrollLogInterval: number;

  eventCounts: { [key: string]: number };

  logInterval: number;

  // eslint-disable-next-line  no-undef
  logTimer: NodeJS.Timeout | null;

  constructor() {
    this.isLogging = false;
    this.logEntries = [];
    this.uniqueKeys = new Set();
    this.lastMouseLogTime = 0;
    this.mouseLogInterval = 50;
    this.scrollLogInterval = 50;
    this.startTime = 0;
    this.stopTime = Infinity;
    this.eventCounts = {
      keydown: 0,
      keyup: 0,
      mousedown: 0,
      mouseup: 0,
      mousemove: 0,
      wheel: 0,
    };
    this.logInterval = 3 * 60 * 1000; // 3 minutes in milliseconds
    this.logTimer = null;
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
      log.info('uIOhook started');

      // Set the log timer
      this.logTimer = setInterval(this.logEventSummary, this.logInterval);
    } catch (error) {
      log.error('Error starting keylogging', { error });
      this.isLogging = false;
    }
  }

  logKeyDown = (e: UiohookKeyboardEvent) => {
    try {
      if (Date.now() > this.stopTime) return;
      const timestamp = Date.now();
      const key = keycodesMapping[e.keycode];
      this.logEntries.push({
        timestamp,
        entry: `Keyboard Button Press : ${key}`,
      });
      this.uniqueKeys.add(key);
      this.eventCounts.keydown += 1;
    } catch (error) {
      log.error('Error logging key down', error);
    }
  };

  logKeyUp = (e: UiohookKeyboardEvent) => {
    try {
      if (Date.now() > this.stopTime) return;
      const timestamp = Date.now();
      const key = keycodesMapping[e.keycode];
      this.logEntries.push({
        timestamp,
        entry: `Keyboard Button Release : ${key}`,
      });
      this.eventCounts.keyup += 1;
    } catch (error) {
      log.error('Error logging key up', error);
    }
  };

  logMouseDown = (e: UiohookMouseEvent) => {
    try {
      if (Date.now() > this.stopTime) return;
      const timestamp = Date.now();
      const button = `Mouse Button ${e.button}`;
      this.logEntries.push({
        timestamp,
        entry: `Mouse Button Press : ${button}`,
      });
      this.uniqueKeys.add(button);
      this.eventCounts.mousedown += 1;
    } catch (error) {
      log.error('Error logging mouse down', error);
    }
  };

  logMouseUp = (e: UiohookMouseEvent) => {
    try {
      if (Date.now() > this.stopTime) return;
      const timestamp = Date.now();
      const button = `Mouse Button ${e.button}`;
      this.logEntries.push({
        timestamp,
        entry: `Mouse Button Release : ${button}`,
      });
      this.eventCounts.mouseup += 1;
    } catch (error) {
      log.error('Error logging mouse up', error);
    }
  };

  logMouseMove = (e: UiohookMouseEvent) => {
    try {
      if (Date.now() > this.stopTime) return;
      const timestamp = Date.now();
      this.logEntries.push({
        timestamp,
        entry: `Mouse moved to X:${e.x}, Y:${e.y}`,
      });
      this.eventCounts.mousemove += 1;
    } catch (error) {
      log.error('Error logging mouse move', error);
    }
  };

  logScroll = (e: UiohookWheelEvent) => {
    try {
      if (Date.now() > this.stopTime) return;
      const timestamp = Date.now();
      const axis = e.direction === 3 ? 'Vertical' : 'Horizontal';
      let direction;
      if (axis === 'Vertical') {
        direction = e.rotation > 0 ? 'UP' : 'DOWN';
      } else {
        direction = e.rotation > 0 ? 'LEFT' : 'RIGHT';
      }
      this.logEntries.push({
        timestamp,
        entry: `Mouse Scrolled ${axis}, Direction: ${direction}, Intensity: ${
          e.rotation < 0 ? e.rotation * -1 : e.rotation
        }`,
      });
      this.eventCounts.wheel += 1;
    } catch (error) {
      log.error('Error logging scroll', error);
    }
  };

  logEventSummary = () => {
    log.info(`Events Summary:`, { summary: this.eventCounts });

    // Reset the event counts
    this.eventCounts = {
      keydown: 0,
      keyup: 0,
      mousedown: 0,
      mouseup: 0,
      mousemove: 0,
      wheel: 0,
    };
  };

  getFormattedTime(timestamp: number) {
    const time = timestamp - this.startTime;
    const milliseconds = `000${time % 1000}`.slice(-3);
    const totalSeconds = Math.floor(time / 1000);
    const seconds = `0${totalSeconds % 60}`.slice(-2);
    const minutes = `0${Math.floor((totalSeconds / 60) % 60)}`.slice(-2);
    const hours = `0${Math.floor(totalSeconds / 3600) % 24}`.slice(-2);

    return `${hours}:${minutes}:${seconds}:${milliseconds}`;
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
      if (this.logTimer) {
        clearInterval(this.logTimer);
        this.logTimer = null;
      }
    } catch (error) {
      log.error('Error stopping keylogging', error);
    }

    // remove extra entries after record stops
    this.logEntries = this.logEntries.filter(
      (logEntry) => logEntry.timestamp <= recordingStopTime,
    );

    // Commit any remaining logs before stopping
    this.logEventSummary();
    const logContent = this.logEntries
      .map(
        (logEntry) =>
          `${this.getFormattedTime(logEntry.timestamp)}: ${logEntry.entry}`,
      )
      .join('\n');
    this.logEntries = [];
    this.stopTime = Infinity;
    return logContent;
  }
}

export default new KeyLogger();
