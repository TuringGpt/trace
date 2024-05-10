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
import { ROUTE_SAVE_ZIP, ROUTE_UPLOAD, ROUTE_UPLOAD_DASHBOARD } from '../constants'; // Adjust the import path as necessary

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
        <Route path={ROUTE_SAVE_ZIP} element={<FileOptions />} />
        <Route path={ROUTE_UPLOAD} element={<Upload />} />
        <Route path={ROUTE_UPLOAD_DASHBOARD} element={<UploadDashboard />} />
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
