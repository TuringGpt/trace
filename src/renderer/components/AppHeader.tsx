import { useEffect, useState } from 'react';
import { APP_TITLE, APP_SUBTITLE } from '../../constants';
import icon from '../../../assets/icon.svg';

export default function AppHeader() {
  const [appVersion, setAppVersion] = useState('');

  useEffect(() => {
    (async () => {
      const res = await window.electron.getAppVersion();
      if (res.status === 'success') {
        setAppVersion(res.data);
      }
    })();
  }, []);

  return (
    <>
      <div className="flex justify-center">
        <img
          alt="icon"
          src={icon}
          className="inline-block h-12 mt-12 mb-2 mr-2"
        />
        <h1 className="text-5xl mt-12 mb-2 font-sans inline-block font-bold text-center">
          {APP_TITLE}
        </h1>
      </div>
      <p className="text-center text-gray-400 text-l mb-4">v{appVersion}</p>
      <p className="text-center text-xl"> {APP_SUBTITLE} </p>
    </>
  );
}
