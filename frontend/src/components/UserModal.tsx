import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { User, CreateUserData, UpdateUserData } from '../services/users.service';
import Modal from './Modal';
import ModalButtons from './ModalButtons';

interface UserModalProps {
  user: User | null;
  onClose: () => void;
  onSave: (data: CreateUserData | UpdateUserData) => Promise<void>;
}

export default function UserModal({ user, onClose, onSave }: UserModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    roleType: 'REQUESTER',
    language: 'es'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        roleType: user.roleType,
        language: user.language
      });
    }
  }, [user]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    // Solo validar name y email si NO es un usuario de Google
    if (!user?.googleId) {
      if (!formData.name.trim()) {
        newErrors.name = 'El nombre es requerido';
      } else if (formData.name.trim().length < 2) {
        newErrors.name = 'El nombre debe tener al menos 2 caracteres';
      }

      if (!formData.email.trim()) {
        newErrors.email = 'El email es requerido';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'El email no es válido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    try {
      setLoading(true);
      
      // Si el usuario tiene googleId, solo enviar rol y language
      const dataToSend = user?.googleId 
        ? { roleType: formData.roleType, language: formData.language }
        : formData;
      
      await onSave(dataToSend);
      onClose();
    } catch (error: any) {
      toast.error('Error al guardar usuario', {
        description: error.response?.data?.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={!!user || user === null}
      onClose={onClose}
      title={user ? 'Editar Usuario' : 'Crear Usuario'}
      size="md"
      footer={
        <ModalButtons
          onCancel={onClose}
          confirmType="submit"
          confirmText={user ? 'Actualizar' : 'Crear'}
          loading={loading}
          formId="user-form"
        />
      }
    >
      <form onSubmit={handleSubmit} id="user-form" className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre Completo *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } ${user?.googleId ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : ''}`}
              placeholder="Ej: Juan Pérez"
              disabled={!!user?.googleId}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
            )}
            {user?.googleId && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">El nombre proviene de Google y no se puede modificar</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } ${user ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : ''}`}
              placeholder="Ej: juan@ejemplo.com"
              disabled={!!user}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
            )}
            {user && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {user.googleId ? 'El email proviene de Google y no se puede modificar' : 'El email no se puede modificar'}
              </p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rol *
            </label>
            <select
              value={formData.roleType}
              onChange={(e) => setFormData({ ...formData, roleType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="REQUESTER">Solicitante</option>
              <option value="SUBORDINATE">Subordinado</option>
              <option value="DEPT_ADMIN">Admin de Departamento</option>
              <option value="SUPER_ADMIN">Super Administrador</option>
            </select>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Idioma
            </label>
            <select
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>

      </form>
    </Modal>
  );
}
