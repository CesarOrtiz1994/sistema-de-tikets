import { useState, useEffect } from 'react';
import { Department, CreateDepartmentData, UpdateDepartmentData } from '../../services/departments.service';
import Modal from '../common/Modal';
import ModalButtons from '../common/ModalButtons';
import { validateForm, departmentSchema } from '../../utils/validationSchemas';

interface DepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateDepartmentData | UpdateDepartmentData) => Promise<void>;
  department?: Department | null;
}

export default function DepartmentModal({ isOpen, onClose, onSave, department }: DepartmentModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    prefix: '',
    description: '',
    isDefaultForRequesters: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name,
        prefix: department.prefix,
        description: department.description || '',
        isDefaultForRequesters: department.isDefaultForRequesters
      });
    } else {
      setFormData({
        name: '',
        prefix: '',
        description: '',
        isDefaultForRequesters: false
      });
    }
    setErrors({});
  }, [department, isOpen]);

  const validate = () => {
    const result = validateForm(departmentSchema, formData);
    
    if (!result.success) {
      setErrors(result.errors);
      return false;
    }
    
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error al guardar departamento:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={department ? 'Editar Departamento' : 'Nuevo Departamento'}
      size="md"
      footer={
        <ModalButtons
          onCancel={onClose}
          confirmType="submit"
          confirmText="Guardar"
          loading={loading}
          formId="department-form"
        />
      }
    >
      <form onSubmit={handleSubmit} id="department-form" className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre del Departamento *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Ej: Recursos Humanos"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Prefijo *
            </label>
            <input
              type="text"
              value={formData.prefix}
              onChange={(e) => setFormData({ ...formData, prefix: e.target.value.toUpperCase() })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.prefix ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Ej: RH"
              maxLength={10}
            />
            {errors.prefix && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.prefix}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              El prefijo se usará para identificar tickets (ej: RH-001)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Descripción del departamento"
              rows={3}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isDefaultForRequesters"
              checked={formData.isDefaultForRequesters}
              onChange={(e) => setFormData({ ...formData, isDefaultForRequesters: e.target.checked })}
              className="w-4 h-4 text-purple-600 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500"
            />
            <label htmlFor="isDefaultForRequesters" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Departamento por defecto para solicitantes
            </label>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
            Los nuevos usuarios con rol "Solicitante" serán asignados automáticamente a este departamento
          </p>

      </form>
    </Modal>
  );
}
