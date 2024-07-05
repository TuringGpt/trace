import { FaSignOutAlt } from 'react-icons/fa';
import { useDialog } from '../hooks/useDialog';
import { DialogType } from '../../types/customTypes';

function LogoutButton() {
  const { showDialog } = useDialog();

  const handleLogout = async () => {
    const consent = await showDialog(
      'Log out',
      "Log out from Trace? Make sure you're not recording or processing any videos. Only log out if you've saved all your recordings.",
      {
        type: DialogType.Confirmation,
        buttons: ['Yes, Log out', 'Cancel'],
      },
    );

    if (consent.success) {
      localStorage.removeItem('authToken');
      await window.electron.removeRefreshToken();
      window.location.reload();
    }
  };

  return (
    <button
      type="button"
      className="fixed bottom-16 right-16 transition duration-300 ease-in-out transform hover:-translate-y-1"
      onClick={handleLogout}
      aria-label="Log out"
    >
      <FaSignOutAlt className="h-8 text-5xl text-indigo-600 hover:scale-105" /> 
    </button>
  );
}

export default LogoutButton;
