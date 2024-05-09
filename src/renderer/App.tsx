import 'tailwindcss/tailwind.css';
import 'react-tooltip/dist/react-tooltip.css';
import './App.css';

import clsx from 'clsx';
import { MemoryRouter as Router, Route, Routes } from 'react-router-dom';

import AppHeader from './components/AppHeader';
import BusyOverlay from './components/BusyOverlay';
import NavigationButton from './components/NavigationButton';
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
        {/** This is temporary start */}
        <Route path="/" element={<FileOptions />} />
        <Route path="/video-recorder" element={<VideoRecorder />} />
        {/** This is temporary end */}
        {/* <Route path="/" element={<VideoRecorder />} /> */}
        <Route path="/save-video" element={<FileOptions />} />
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
          <NavigationButton />
          <AppRoutes />
        </div>
      </Router>
    </AppStateProvider>
  );
}
