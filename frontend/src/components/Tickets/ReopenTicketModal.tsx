import { useState } from 'react';
import { FiRotateCcw } from 'react-icons/fi';
import Modal from '../common/Modal';
import ModalButtons from '../common/ModalButtons';
import ValidationError from '../common/ValidationError';
import { ticketRatingValidators } from '../../validators/ticketRating.validator';
import { z } from 'zod';

interface ReopenTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  ticketNumber: string;
}

export default function ReopenTicketModal({
  isOpen,
  onClose,
  onConfirm,
  ticketNumber
}: ReopenTicketModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    try {
      setError('');

      // Validar con Zod
      ticketRatingValidators.reopenTicket.parse({ reason: reason.trim() });

      setLoading(true);
      await onConfirm(reason.trim());
      
      // Resetear formulario
      setReason('');
      onClose();
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0]?.message || 'Error de validación');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Reabrir Ticket"
      subtitle={`Ticket #${ticketNumber}`}
      size="md"
      footer={
        <ModalButtons
          onCancel={handleClose}
          onConfirm={handleSubmit}
          cancelText="Cancelar"
          confirmText="Reabrir Ticket"
          confirmIcon={<FiRotateCcw />}
          loading={loading}
          variant="primary"
        />
      }
    >
      <div className="space-y-4">
        {/* Mensaje de advertencia */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ Estás a punto de reabrir este ticket. Por favor indica la razón por la cual el problema no fue resuelto correctamente.
          </p>
        </div>

        {/* Campo de razón */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Razón para reabrir <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explica por qué necesitas reabrir este ticket (mínimo 10 caracteres)..."
            rows={5}
            maxLength={500}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
          />
          <div className="flex justify-between items-center mt-1">
            <div>
              {error && <ValidationError message={error} />}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {reason.length}/500
            </span>
          </div>
        </div>

        {/* Nota informativa */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            El ticket volverá al estado "En Progreso" y se notificará al equipo de soporte.
          </p>
        </div>
      </div>
    </Modal>
  );
}
