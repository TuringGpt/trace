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
import GoogleSignInButton from './components/GoogleSignInButton';
import AuthHandler from './components/AuthHandler';

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

  const checkAuthToken = async () => {
    const tokens = await window.electron.getTokens();
    if (tokens.status === 'success' && tokens.data.accessToken) {
      setAuthToken(tokens.data.accessToken);
    }
  };

  useEffect(() => {
    checkAuthToken();
  }, []);

  const handleAuthSuccess = () => {
    checkAuthToken();
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
              <GoogleSignInButton />
            </div>
          )}
          <AuthHandler onAuthSuccess={handleAuthSuccess} />
        </div>
      </Router>
    </AppStateProvider>
  );
}
