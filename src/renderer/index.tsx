import { createRoot } from 'react-dom/client';

import App from './App';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(<App />);

window.addEventListener('error', (event) => {
  window.electron.reportUnhandledError({
    type: 'UnhandledError',
    error: event.error,
  });
});

window.addEventListener('unhandledrejection', (event) => {
  window.electron.reportUnhandledError({
    type: 'UnhandledRejection',
    error: event.reason,
    promise: event.promise,
  });
});
