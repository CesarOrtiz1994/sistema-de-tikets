import { useState } from 'react';
import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import Modal from '../common/Modal';
import ModalButtons from '../common/ModalButtons';
import StarRating from '../common/StarRating';
import ValidationError from '../common/ValidationError';
import { ticketRatingValidators } from '../../validators/ticketRating.validator';
import { z } from 'zod';

interface CloseTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (rating?: number, comment?: string) => Promise<void>;
  requireRating: boolean;
  ticketNumber: string;
}

export default function CloseTicketModal({
  isOpen,
  onClose,
  onConfirm,
  requireRating,
  ticketNumber
}: CloseTicketModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ rating?: string; comment?: string }>({});

  const handleSubmit = async () => {
    try {
      setErrors({});

      // Validar con Zod
      const data = {
        rating: rating > 0 ? rating : undefined,
        comment: comment.trim() || undefined
      };

      // Si el departamento requiere calificación, validar que se haya proporcionado
      if (requireRating && !data.rating) {
        setErrors({ rating: 'Debes seleccionar una calificación' });
        return;
      }

      ticketRatingValidators.closeWithRating.parse(data);

      setLoading(true);
      await onConfirm(data.rating, data.comment);
      
      // Resetear formulario
      setRating(0);
      setComment('');
      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { rating?: string; comment?: string } = {};
        error.issues.forEach((err: z.ZodIssue) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as 'rating' | 'comment'] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setComment('');
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Cerrar Ticket"
      subtitle={`Ticket #${ticketNumber}`}
      size="md"
      footer={
        <ModalButtons
          onCancel={handleClose}
          onConfirm={handleSubmit}
          cancelText="Cancelar"
          confirmText={requireRating ? "Calificar y Cerrar" : "Cerrar"}
          confirmIcon={<FiCheckCircle />}
          loading={loading}
          variant="success"
        />
      }
    >
      <div className="space-y-6">
        {requireRating ? (
          // Contenido cuando SE REQUIERE calificación
          <>
            {/* Mensaje informativo */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                ¿Estás satisfecho con la solución? Por favor califica el servicio recibido.
              </p>
            </div>

            {/* Calificación con estrellas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Calificación <span className="text-red-500">*</span>
              </label>
              <StarRating
                rating={rating}
                onRatingChange={setRating}
                size="lg"
                showLabel={true}
              />
              {errors.rating && <ValidationError message={errors.rating} />}
            </div>

            {/* Comentario opcional */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Comentario (opcional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Comparte tu experiencia o sugerencias..."
                rows={4}
                maxLength={1000}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
              />
              <div className="flex justify-between items-center mt-1">
                <div>
                  {errors.comment && <ValidationError message={errors.comment} />}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {comment.length}/1000
                </span>
              </div>
            </div>

            {/* Nota final */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Al cerrar este ticket, confirmas que el problema ha sido resuelto satisfactoriamente.
                La calificación es obligatoria para este departamento.
              </p>
            </div>
          </>
        ) : (
          // Contenido cuando NO SE REQUIERE calificación - Solo confirmación
          <>
            {/* Mensaje de confirmación */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FiAlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                    ¿Estás seguro que deseas cerrar el ticket #{ticketNumber}?
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    Al cerrar este ticket, confirmas que el problema ha sido resuelto satisfactoriamente.
                    El estado cambiará a "Cerrado".
                  </p>
                </div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Este departamento no requiere calificación para cerrar tickets.
                Si deseas, puedes reabrir el ticket más tarde si es necesario.
              </p>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
