import { FaHome } from 'react-icons/fa';
import { VscCloudUpload } from 'react-icons/vsc';
import { useLocation, useNavigate } from 'react-router-dom';
import { UPLOAD_DASHBOARD_PATH, HOME_LABEL, UPLOAD_LABEL } from '../../constants'; // adjust the path as necessary

export default function NavigationButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const isUploadDashboard = location.pathname === UPLOAD_DASHBOARD_PATH;

  const onButtonClick = () => {
    navigate(isUploadDashboard ? '/' : UPLOAD_DASHBOARD_PATH);
  };

  return (
    <button
      type="button"
      onClick={onButtonClick}
      id="uploadButton"
      aria-label={isUploadDashboard ? HOME_LABEL : UPLOAD_LABEL}
    >
      {isUploadDashboard ? (
        <FaHome className="h-12 absolute top-10 right-10 text-8xl text-indigo-600 hover:scale-105" />
      ) : (
        <VscCloudUpload className="h-12 absolute top-10 right-10 text-8xl text-indigo-600 hover:scale-105" />
      )}
    </button>
  );
}
