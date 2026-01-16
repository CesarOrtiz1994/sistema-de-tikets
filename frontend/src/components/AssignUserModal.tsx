import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { FiUserPlus } from 'react-icons/fi';
import Modal from './Modal';
import ModalButtons from './ModalButtons';
import { validateForm, assignUserSchema } from '../utils/validationSchemas';

interface User {
  id: string;
  name: string;
  email: string;
  roleType: string;
}

interface AssignUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (userId: string, role: 'ADMIN' | 'MEMBER') => Promise<void>;
  availableUsers: User[];
}

export default function AssignUserModal({ isOpen, onClose, onAssign, availableUsers }: AssignUserModalProps) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setSelectedUserId('');
      setSelectedRole('MEMBER');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = validateForm(assignUserSchema, {
      userId: selectedUserId,
      role: selectedRole
    });

    if (!result.success) {
      setErrors(result.errors);
      toast.warning('Por favor completa todos los campos requeridos');
      return;
    }

    setLoading(true);
    try {
      await onAssign(selectedUserId, selectedRole);
      onClose();
    } catch (error) {
      console.error('Error al asignar usuario:', error);
      toast.error('Error al asignar usuario al departamento');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Asignar Usuario al Departamento"
      size="md"
      footer={
        <ModalButtons
          onCancel={onClose}
          confirmType="submit"
          confirmText="Asignar Usuario"
          confirmIcon={<FiUserPlus />}
          loading={loading}
          confirmDisabled={!selectedUserId}
          formId="assign-user-form"
        />
      }
    >
      <form onSubmit={handleSubmit} id="assign-user-form" className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Seleccionar Usuario *
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.userId ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              required
            >
              <option value="">-- Selecciona un usuario --</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
            {errors.userId && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.userId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rol en el Departamento *
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as 'ADMIN' | 'MEMBER')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="MEMBER">Miembro</option>
              <option value="ADMIN">Administrador</option>
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Los administradores pueden gestionar el departamento
            </p>
          </div>

      </form>
    </Modal>
  );
}
