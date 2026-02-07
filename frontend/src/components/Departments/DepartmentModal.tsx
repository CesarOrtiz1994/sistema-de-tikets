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
    isDefaultForRequesters: false,
    requireRating: true,
    autoCloseAfterDays: 8,
    requireDeliverable: false,
    maxDeliverableRejections: 3
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name,
        prefix: department.prefix,
        description: department.description || '',
        isDefaultForRequesters: department.isDefaultForRequesters,
        requireRating: department.requireRating ?? true,
        autoCloseAfterDays: (department as any).autoCloseAfterDays ?? 8,
        requireDeliverable: (department as any).requireDeliverable ?? false,
        maxDeliverableRejections: (department as any).maxDeliverableRejections ?? 3
      });
    } else {
      setFormData({
        name: '',
        prefix: '',
        description: '',
        isDefaultForRequesters: false,
        requireRating: true,
        autoCloseAfterDays: 8,
        requireDeliverable: false,
        maxDeliverableRejections: 3
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
              Permitir acceso público para crear tickets
            </label>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
            Cualquier usuario podrá crear tickets en este departamento sin necesidad de asignarle acceso específico
          </p>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="requireRating"
              checked={formData.requireRating}
              onChange={(e) => setFormData({ ...formData, requireRating: e.target.checked })}
              className="w-4 h-4 text-purple-600 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500"
            />
            <label htmlFor="requireRating" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Requerir calificación al cerrar tickets
            </label>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
            Los usuarios deberán calificar el servicio (1-5 estrellas) antes de cerrar un ticket resuelto
          </p>

          <div>
            <label htmlFor="autoCloseAfterDays" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Auto-cerrar tickets después de (días hábiles)
            </label>
            <input
              type="number"
              id="autoCloseAfterDays"
              value={formData.autoCloseAfterDays}
              onChange={(e) => setFormData({ ...formData, autoCloseAfterDays: parseInt(e.target.value) || 8 })}
              min="1"
              max="90"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            {errors.autoCloseAfterDays && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.autoCloseAfterDays}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Los tickets en estado "Resuelto" se cerrarán automáticamente después de este número de días hábiles (tomando en cuenta el horario laboral del departamento)
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="requireDeliverable"
              checked={formData.requireDeliverable}
              onChange={(e) => setFormData({ ...formData, requireDeliverable: e.target.checked })}
              className="w-4 h-4 text-purple-600 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500"
            />
            <label htmlFor="requireDeliverable" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Requerir entregable al resolver tickets
            </label>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
            Los técnicos deberán subir un archivo entregable al resolver tickets. El solicitante podrá aprobar o rechazar el entregable.
          </p>

          {formData.requireDeliverable && (
            <div className="ml-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <label htmlFor="maxDeliverableRejections" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Límite de rechazos de entregables
              </label>
              <input
                type="number"
                id="maxDeliverableRejections"
                value={formData.maxDeliverableRejections}
                onChange={(e) => setFormData({ ...formData, maxDeliverableRejections: parseInt(e.target.value) || 3 })}
                min="1"
                max="10"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
              {errors.maxDeliverableRejections && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.maxDeliverableRejections}</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Si el solicitante rechaza el entregable este número de veces, el ticket se cerrará automáticamente y se creará un nuevo ticket de seguimiento.
              </p>
            </div>
          )}

      </form>
    </Modal>
  );
}
