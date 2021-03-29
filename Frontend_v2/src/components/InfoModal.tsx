import React, { ReactElement } from 'react';
import Modal from 'react-modal';
import ClearIcon from './Icons/ClearIcon';

Modal.setAppElement('#root');

interface InfoModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  header: string;
  message: string;
}
function InfoModal(props: InfoModalProps): ReactElement {
  const { isOpen, onDismiss, header, message } = props;

  return (
    <Modal isOpen={isOpen} className="modal flex flex-col">
      <div className="flex-shrink-0 flex items-center justify-between">
        <h2 className="text-2xl font-bold">{header}</h2>
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200"
          onClick={onDismiss}
        >
          <ClearIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 mt-4">{message}</div>

      <div className="flex-shrink-0 flex mt-2 justify-end">
        <button
          type="button"
          className="button bg-green-800 text-white hover:bg-green-600 disabled:opacity-40 disabled:pointer-events-none"
          onClick={onDismiss}
        >
          Ok
        </button>
      </div>
    </Modal>
  );
}

export default InfoModal;
