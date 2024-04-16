import { uIOhook } from 'uiohook-napi';
import throttle from '../../renderer/util/throttle';
import keycodesMapping from './keycodes';

let isLogging = false;
let logEntries: string[] = [];
const mouseLogInterval = 50;
const scrollLogInterval = 50;

const getFormattedTime = (startTime: number, currentTime: number) => {
  const time = currentTime - startTime;
  const milliseconds = time % 1000;
  const seconds = Math.floor((time / 1000) % 60);
  const minutes = Math.floor((time / (1000 * 60)) % 60);
  const hours = Math.floor((time / (1000 * 60 * 60)) % 24);

  const fHours = hours < 10 ? `0${hours}` : hours;
  const fMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const fSeconds = seconds < 10 ? `0${seconds}` : seconds;
  const fMilliseconds = milliseconds.toString().padStart(3, '0');

  return `${fHours}:${fMinutes}:${fSeconds}:${fMilliseconds}`;
};

const startLogging = (startTime: number) => {
  if (isLogging) return;
  isLogging = true;

  uIOhook.on('keyup', (e) => {
    const currentTime = Date.now();
    const timestamp = getFormattedTime(startTime, currentTime);
    logEntries.push(
      `${timestamp}: Keyboard Button Press : ${keycodesMapping[e.keycode]}`,
    );
  });

  uIOhook.on('mousedown', (e) => {
    const currentTime = Date.now();
    const timestamp = getFormattedTime(startTime, currentTime);
    logEntries.push(`${timestamp}: Mouse Button Press : ${e.button}`);
  });

  uIOhook.on('mouseup', (e) => {
    const currentTime = Date.now();
    const timestamp = getFormattedTime(startTime, currentTime);
    logEntries.push(`${timestamp}: Mouse Button Release : ${e.button}`);
  });

  const throttledMouseMove = throttle((e) => {
    const currentTime = Date.now();
    const timestamp = getFormattedTime(startTime, currentTime);
    logEntries.push(`${timestamp}: Mouse moved to X:${e.x}, Y:${e.y}`);
  }, mouseLogInterval);

  uIOhook.on('mousemove', throttledMouseMove);

  const logScroll = throttle((e) => {
    const currentTime = Date.now();
    const timestamp = getFormattedTime(startTime, currentTime);
    const axis = e.direction === 3 ? 'Vertical' : 'Horizontal';
    let direction;
    if (axis === 'Vertical') {
      direction = e.rotation > 0 ? 'UP' : 'DOWN';
    } else {
      direction = e.rotation > 0 ? 'LEFT' : 'RIGHT';
    }
    logEntries.push(
      `${timestamp}: Scrolled ${axis}, Direction: ${direction}, Intensity: ${
        e.rotation < 0 ? e.rotation * -1 : e.rotation
      }`,
    );
  }, scrollLogInterval);

  uIOhook.on('wheel', logScroll);

  uIOhook.start();
};

const stopLogging = (): string | null => {
  if (!isLogging) return null;
  isLogging = false;
  uIOhook.removeAllListeners();
  uIOhook.stop();
  const logContent = logEntries.join('\n');
  logEntries = [];
  return logContent;
};

export default {
  startLogging,
  stopLogging,
};
