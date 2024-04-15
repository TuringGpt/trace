import 'tailwindcss/tailwind.css';
import './App.css';

import clsx from 'clsx';
import { MemoryRouter as Router, Route, Routes } from 'react-router-dom';

import AppHeader from './AppHeader';
import BusyOverlay from './BusyOverlay';
import FileOptions from './pages/FileOptions';
import Upload from './pages/Upload';
import VideoRecorder from './pages/VideoRecorder';
import useAppState from './store/hook';
import AppStateProvider from './store/provider';
import UploadButton from './UploadButton';

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
