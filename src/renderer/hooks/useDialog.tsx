import React, { useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import Modal from 'react-modal';
import { DialogOptions } from '../../types/customTypes';

interface ExtendedDialogOptions extends DialogOptions {
  useNative?: boolean;
}

Modal.setAppElement('#root');

const showReactDialog = async (
  title: string,
  message: string,
  options: ExtendedDialogOptions,
): Promise<{ success: boolean }> => {
  return new Promise((resolve) => {
    const modalRoot = document.createElement('div');
    document.body.appendChild(modalRoot);
    const root = createRoot(modalRoot);
    const closeModal = () => {
      if (root) {
        root.unmount();
      }
      document.body.removeChild(modalRoot);
    };
    const onConfirm = () => {
      resolve({ success: true });
      closeModal();
    };
    const onCancel = () => {
      resolve({ success: false });
      closeModal();
    };

    function Dialog() {
      return (
        <Modal
          isOpen
          contentLabel={title}
          className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center"
        >
          <div className="bg-white p-8 rounded-lg shadow-lg w-96">
            <h2 className="text-2xl font-bold mb-4">{title}</h2>
            <p className="mb-4">{message}</p>
            <div className="flex justify-end space-x-4">
              {options.buttons.map((buttonTitle, index) => (
                <button
                  key={buttonTitle}
                  type="button"
                  onClick={index === 0 ? onConfirm : onCancel}
                  className={`py-2 px-4 rounded ${index === 0 ? 'bg-blue-500 text-white hover:bg-blue-700' : 'bg-gray-300 text-black hover:bg-gray-400'}`}
                >
                  {buttonTitle}
                </button>
              ))}
            </div>
          </div>
        </Modal>
      );
    }

    root.render(<Dialog />);
  });
};

export function useDialog() {
  const showDialog = useCallback(
    async (
      title: string,
      message: string,
      options: ExtendedDialogOptions,
    ): Promise<{ success: boolean }> => {
      if (options.useNative) {
        const res = await window.electron.showDialog(title, message, options);
        return { success: res.status === 'success' && res.data };
      }
      return showReactDialog(title, message, options);
    },
    [],
  );

  return {
    showDialog,
  };
}

export default useDialog;
