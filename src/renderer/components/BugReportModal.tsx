import React, { useState } from 'react';
import Modal from 'react-modal';

type TimeRange = '1hour' | '6hours' | '1day';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function BugReportModal({ isOpen, onClose }: BugReportModalProps) {
  const [description, setDescription] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>('1hour');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bugReportId, setBugReportId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (description.length < 100) {
      setError('Description must be at least 100 characters long.');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await window.electron.reportError(description, timeRange);
      if (res.status === 'error') {
        setError(`Failed to report bug: ${res.message}`);
        return;
      }
      const uuid = res.data;
      setBugReportId(uuid);
    } catch (err) {
      setError('Failed to report bug. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    setDescription('');
    setTimeRange('1hour');
    setBugReportId(null);
    setError(null);
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={() => {
        handleClose();
      }}
      className="w-full max-w-md mx-auto mt-20 bg-white p-6 rounded-lg shadow-xl"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
    >
      <h2 className="text-2xl font-bold mb-4 text-indigo-600">Report a Bug</h2>
      {!bugReportId ? (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="description" className="block">
              <span className="text-sm font-medium text-gray-700 mb-1 block">
                Description
              </span>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-indigo-500 mt-1"
                rows={3}
                required
              />
            </label>
            <div className="text-sm text-gray-500">
              {description.length} characters typed
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="time" className="block">
              <span className="text-sm font-medium text-gray-700 mb-1 block">
                Time Range for Logs
              </span>
              <select
                id="time"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-indigo-500 mt-1"
              >
                <option value="1hour">Last 1 Hour</option>
                <option value="6hours">Last 6 Hours</option>
                <option value="1day">Last 24 Hours</option>
              </select>
            </label>
          </div>
          {error && (
            <p className="text-red-500 mb-4" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                handleClose();
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                'Send Bug Report'
              )}
            </button>
          </div>
        </form>
      ) : (
        <div>
          <p className="text-green-600 mb-4">
            Bug report submitted successfully!
          </p>
          <p className="mb-4">
            Your bug report ID is:{' '}
            <span className="font-medium">{bugReportId}</span>
          </p>
          <button
            type="button"
            onClick={() => {
              handleClose();
            }}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Close
          </button>
        </div>
      )}
    </Modal>
  );
}

export default BugReportModal;
