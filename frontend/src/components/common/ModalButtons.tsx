import { ReactNode } from 'react';
import { FiSave } from 'react-icons/fi';

interface ModalButtonsProps {
  onCancel: () => void;
  onConfirm?: () => void;
  cancelText?: string;
  confirmText?: string;
  confirmIcon?: ReactNode;
  loading?: boolean;
  confirmDisabled?: boolean;
  confirmType?: 'button' | 'submit';
  variant?: 'primary' | 'danger' | 'success';
  formId?: string;
}

const variantClasses = {
  primary: 'bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-lg',
  danger: 'bg-red-600 hover:bg-red-700',
  success: 'bg-green-600 hover:bg-green-700'
};

export default function ModalButtons({
  onCancel,
  onConfirm,
  cancelText = 'Cancelar',
  confirmText = 'Guardar',
  confirmIcon = <FiSave />,
  loading = false,
  confirmDisabled = false,
  confirmType = 'button',
  variant = 'primary',
  formId
}: ModalButtonsProps) {
  return (
    <>
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        disabled={loading}
      >
        {cancelText}
      </button>
      <button
        type={confirmType}
        form={formId}
        onClick={confirmType === 'button' ? onConfirm : undefined}
        disabled={loading || confirmDisabled}
        className={`px-4 py-2 text-white rounded-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]}`}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Guardando...</span>
          </>
        ) : (
          <>
            {confirmIcon}
            <span>{confirmText}</span>
          </>
        )}
      </button>
    </>
  );
}
