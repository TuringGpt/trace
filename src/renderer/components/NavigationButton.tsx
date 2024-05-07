import { FaHome } from 'react-icons/fa';
import { VscCloudUpload } from 'react-icons/vsc';
import { useLocation, useNavigate } from 'react-router-dom';

export default function NavigationButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const isUploadDashboard = location.pathname === '/upload-dashboard';

  const onButtonClick = () => {
    navigate(isUploadDashboard ? '/' : '/upload-dashboard');
  };

  return (
    <button
      type="button"
      onClick={onButtonClick}
      id="uploadButton"
      aria-label={isUploadDashboard ? 'Home' : 'Upload'}
    >
      {isUploadDashboard ? (
        <FaHome className="h-12 absolute top-10 right-10 text-8xl text-indigo-600 hover:scale-105" />
      ) : (
        <VscCloudUpload className="h-12 absolute top-10 right-10 text-8xl text-indigo-600 hover:scale-105" />
      )}
    </button>
  );
}
