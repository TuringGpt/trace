import 'tailwindcss/tailwind.css';
import 'react-tooltip/dist/react-tooltip.css';
import './App.css';

import clsx from 'clsx';
import { MemoryRouter as Router, Route, Routes } from 'react-router-dom';

import { useEffect, useState } from 'react';
import {
  ROUTE_UPLOAD,
  ROUTE_UPLOAD_DASHBOARD,
  ROUTE_VIDEO,
} from '../constants';
import AppHeader from './components/AppHeader';
import BusyOverlay from './components/BusyOverlay';
import NavigationButton from './components/NavigationButton';
import FileOptions from './pages/FileOptions';
import Upload from './pages/Upload';
import UploadDashboard from './pages/UploadDashboard';
import VideoRecorder from './pages/VideoRecorder';
import useAppState from './store/hook';
import AppStateProvider from './store/provider';
import Logout from './components/Logout';

function AppRoutes() {
  const { state } = useAppState();

  return (
    <div
      className={clsx({
        hidden: state.busyIndicator.isShow,
      })}
    >
      <Routes>
        <Route path="/" element={<VideoRecorder />} />
        <Route path={ROUTE_VIDEO} element={<FileOptions />} />
        <Route path={ROUTE_UPLOAD} element={<Upload />} />
        <Route path={ROUTE_UPLOAD_DASHBOARD} element={<UploadDashboard />} />
      </Routes>
    </div>
  );
}

export default function App() {
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthToken = async () => {
      const tokens = await window.electron.getTokens();
      if (tokens.status === 'success' && tokens.data.accessToken) {
        setAuthToken(tokens.data.accessToken);
      }
    };
    checkAuthToken();
  }, []);

  const handleGoogleSignIn = () => {
    window.electron.openGoogleAuth();
  };

  return (
    <AppStateProvider>
      <Router>
        <div className="bg-slate-900 text-white h-screen flex flex-col justify-between">
          {authToken ? (
            <div>
              <AppHeader />
              <BusyOverlay />
              <NavigationButton />
              <AppRoutes />
              <Logout />
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <AppHeader />
              <div className="flex-grow flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="text-white w-full max-w-xs mx-auto bg-indigo-800 hover:bg-indigo-900 focus:ring-4 focus:outline-none focus:ring-[#4285F4]/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center justify-center transition duration-300 ease-in-out transform hover:-translate-y-1"
                >
                  <svg
                    className="mr-2 -ml-1 w-4 h-4"
                    aria-hidden="true"
                    focusable="false"
                    data-prefix="fab"
                    data-icon="google"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 488 512"
                  >
                    <path
                      fill="currentColor"
                      d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                    />
                  </svg>
                  Sign in with Google
                </button>
              </div>
            </div>
          )}
        </div>
      </Router>
    </AppStateProvider>
  );
}
