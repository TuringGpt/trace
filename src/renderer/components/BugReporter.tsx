import { useState } from 'react';
import { FaBug } from 'react-icons/fa6';
import BugReportModal from './BugReportModal';

function BugReporter() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="fixed bottom-16 left-16 transition duration-300 ease-in-out transform hover:-translate-y-1"
        onClick={() => setIsModalOpen(true)}
        aria-label="Report a bug"
      >
        <FaBug className="h-8 text-5xl text-indigo-600 hover:scale-105" />
      </button>
      <BugReportModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
        }}
      />
    </>
  );
}

export default BugReporter;
