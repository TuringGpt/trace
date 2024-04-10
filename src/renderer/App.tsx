import { MemoryRouter as Router, Route, Routes } from 'react-router-dom';

import VideoRecorder from './VideoRecorder';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<VideoRecorder />} />
      </Routes>
    </Router>
  );
}
