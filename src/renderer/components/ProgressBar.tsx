import { useEffect, useState } from 'react';

import { isUploadingStatus, StatusTypes } from '../../types/customTypes';
import log from '../util/logger';

export default function ProgressBar() {
  const [progress, setProgress] = useState(0);
  const [overallProgress, setOverallProgress] = useState({
    completed: 0,
    total: 0,
  });

  useEffect(() => {
    log.debug('Subscribing to upload progress');
    const cleanUp = window.electron.onUploadProgress((pr) => {
      const p = pr.status;
      Object.values(p).forEach((uploadStatus) => {
        if (isUploadingStatus(uploadStatus)) {
          setProgress(uploadStatus.progress);
        }
      });
      setOverallProgress({
        completed: Object.values(p).filter((uploadItem) => {
          if (
            uploadItem.status === StatusTypes.Completed ||
            uploadItem.status === StatusTypes.Failed
          ) {
            return true;
          }
          return false;
        }).length,
        total: Object.keys(p).length,
      });
    });
    return () => {
      cleanUp();
    };
  }, []);

  if (overallProgress.total === 0) {
    return null;
  }

  return (
    <div className="flex mt-2 items-center space-x-4">
      <div className="h-6 bg-slate-600 flex-grow rounded-full relative">
        <div
          className="h-6 rounded-full absolute inset-0  bg-gradient-to-r from-green-400 via-green-600 to-green-700"
          style={{ width: `${progress}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-stone-50 font-semibold">
            {`${overallProgress.completed}/${overallProgress.total}`} Upload in
            progress
          </span>
        </div>
      </div>
    </div>
  );
}
