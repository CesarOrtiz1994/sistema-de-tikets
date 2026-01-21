import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { FiUserPlus } from 'react-icons/fi';
import Modal from '../common/Modal';
import ModalButtons from '../common/ModalButtons';

interface User {
  id: string;
  name: string;
  email: string;
  roleType: string;
}

interface AssignTicketAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (userId: string) => Promise<void>;
  availableUsers: User[];
}

export default function AssignTicketAccessModal({ 
  isOpen, 
  onClose, 
  onAssign, 
  availableUsers 
}: AssignTicketAccessModalProps) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedUserId('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId) {
      toast.warning('Por favor selecciona un usuario');
      return;
    }

    setLoading(true);
    try {
      await onAssign(selectedUserId);
      onClose();
    } catch (error) {
      console.error('Error al otorgar acceso:', error);
      toast.error('Error al otorgar acceso para crear tickets');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Otorgar Acceso para Crear Tickets"
      subtitle="Permite que un usuario pueda crear tickets en este departamento"
      size="md"
      footer={
        <ModalButtons
          onCancel={onClose}
          confirmType="submit"
          confirmText="Otorgar Acceso"
          confirmIcon={<FiUserPlus />}
          loading={loading}
          confirmDisabled={!selectedUserId}
          formId="assign-ticket-access-form"
        />
      }
    >
      <form onSubmit={handleSubmit} id="assign-ticket-access-form" className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Seleccionar Usuario *
          </label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          >
            <option value="">-- Selecciona un usuario --</option>
            {availableUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Este usuario podrá crear tickets en este departamento
          </p>
        </div>
      </form>
    </Modal>
  );
}
