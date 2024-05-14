import { Dispatch, SetStateAction } from 'react';

import { RecordedFolder, UploadStatusReport } from '../../types/customTypes';
import VideoCard from './VideoCard';

type VideoCardWrapperProps = {
  video: RecordedFolder;
  selectedVideos: Set<string>;
  uploadProgress: UploadStatusReport;
  onBeforeUpload: (id: string) => void;
  onBeforeDelete: (id: string) => void;
  setSelectedVideos: Dispatch<SetStateAction<Set<string>>>;
};

export default function VideoCardWrapper({
  video,
  selectedVideos,
  uploadProgress,
  onBeforeUpload,
  onBeforeDelete,
  setSelectedVideos,
}: VideoCardWrapperProps) {
  return (
    <VideoCard
      key={video.id}
      video={video}
      multiSelectInProgress={selectedVideos.size > 0}
      uploadProgress={uploadProgress[video.id] || {}}
      isSelected={selectedVideos.has(video.id) || false}
      onUploadTrigger={() => {
        onBeforeUpload(video.id);
      }}
      onDiscardTrigger={() => {
        onBeforeDelete(video.id);
      }}
      onSelect={() => {
        setSelectedVideos((prevState) => {
          const newSelectedVideos = new Set(prevState);
          if (newSelectedVideos.has(video.id)) {
            newSelectedVideos.delete(video.id);
          } else {
            newSelectedVideos.add(video.id);
          }
          return newSelectedVideos;
        });
      }}
    />
  );
}
