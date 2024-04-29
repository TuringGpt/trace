import 'tailwindcss/tailwind.css';
import './App.css';

import clsx from 'clsx';
import { MemoryRouter as Router, Route, Routes } from 'react-router-dom';

import AppHeader from './components/AppHeader';
import BusyOverlay from './components/BusyOverlay';
import UploadButton from './components/UploadButton';
import FileOptions from './pages/FileOptions';
import Upload from './pages/Upload';
import UploadDashboard from './pages/UploadDashboard';
import VideoRecorder from './pages/VideoRecorder';
import useAppState from './store/hook';
import AppStateProvider from './store/provider';

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
        <Route path="/save-zip" element={<FileOptions />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/upload-dashboard" element={<UploadDashboard />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <Router>
        <div className="bg-slate-900 text-white h-screen">
          <AppHeader />
          <BusyOverlay />
          <UploadButton />
          <AppRoutes />
        </div>
      </Router>
    </AppStateProvider>
  );
}
