import { useNavigate } from 'react-router-dom';

import icon from '../../assets/upload.svg';

export default function UploadButton() {
  const navigate = useNavigate();
  const onUploadClick = () => {
    navigate('/upload');
  };
  return (
    <button
      type="button"
      onClick={onUploadClick}
      id="uploadButton"
      aria-label="Upload"
    >
      <img src={icon} className="h-12 absolute top-10 right-10" alt="Upload" />
    </button>
  );
}
