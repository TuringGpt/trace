import { useEffect, useState } from 'react';

export default function UpdatesBanner() {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const res = await window.electron.checkUpdateAvailable();
      if (res.status === 'success') {
        setIsUpdateAvailable(res.data);
      }
    })();
  }, []);

  const openUpdatesUrl = () => {
    window.electron.openUpdatesUrl();
  };

  return (
    isUpdateAvailable && (
      <div className="bg-indigo-700 text-white text-center p-1">
        New update is available. Download from{' '}
        <button type="button" onClick={openUpdatesUrl} className="underline">
          here
        </button>
        .
      </div>
    )
  );
}
