import { useEffect } from 'react';

function AuthHandler({ onAuthSuccess }: { onAuthSuccess: () => void }) {
  useEffect(() => {
    window.electron.onAuthSuccess(() => {
      onAuthSuccess();
    });
  }, [onAuthSuccess]);
  return null;
}

export default AuthHandler;
