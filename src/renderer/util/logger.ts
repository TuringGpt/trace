/* eslint-disable no-console */
const log = {
  error: (...args: any[]) => {
    console.error('[R]', ...args);
    window.electron.logFromRenderer('error', ...args);
  },
  info: (...args: any[]) => {
    console.log('[R]', ...args);
    window.electron.logFromRenderer('info', ...args);
  },
  warn: (...args: any[]) => {
    console.warn('[R]', ...args);
    window.electron.logFromRenderer('warn', ...args);
  },
  debug: (...args: any[]) => {
    console.debug('[R]', ...args);
    window.electron.logFromRenderer('debug', ...args);
  },
};

export default log;
