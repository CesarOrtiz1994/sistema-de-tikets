import { useState, useEffect } from 'react';
import { FiSave } from 'react-icons/fi';
import Modal from '../common/Modal';
import ModalButtons from '../common/ModalButtons';
import { validateForm, slaConfigurationSchema } from '../../utils/validationSchemas';
import { toast } from 'sonner';

interface SLAConfiguration {
  id?: string;
  name: string;
  description: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  responseTime: number;
  resolutionTime: number;
  escalationEnabled: boolean;
  escalationTime: number | null;
  businessHoursOnly: boolean;
  notifyOnBreach: boolean;
  notifyBefore: number | null;
  isActive: boolean;
  isDefault: boolean;
}

interface SLAConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<SLAConfiguration>) => Promise<void>;
  slaConfiguration?: SLAConfiguration | null;
}

export default function SLAConfigurationModal({
  isOpen,
  onClose,
  onSave,
  slaConfiguration
}: SLAConfigurationModalProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Partial<SLAConfiguration>>({
    name: '',
    description: '',
    priority: 'MEDIUM',
    responseTime: 60,
    resolutionTime: 480,
    escalationEnabled: false,
    escalationTime: null,
    businessHoursOnly: false,
    notifyOnBreach: true,
    notifyBefore: 30,
    isActive: true,
    isDefault: false
  });

  useEffect(() => {
    if (slaConfiguration) {
      setFormData(slaConfiguration);
    } else {
      setFormData({
        name: '',
        description: '',
        priority: 'MEDIUM',
        responseTime: 60,
        resolutionTime: 480,
        escalationEnabled: false,
        escalationTime: null,
        businessHoursOnly: false,
        notifyOnBreach: true,
        notifyBefore: 30,
        isActive: true,
        isDefault: false
      });
    }
  }, [slaConfiguration, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = validateForm(slaConfigurationSchema, formData);
    
    if (!result.success) {
      setErrors(result.errors);
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }
    
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving SLA configuration:', error);
      toast.error('Error al guardar la configuración SLA');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof SLAConfiguration, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={slaConfiguration ? 'Editar Configuración SLA' : 'Nueva Configuración SLA'}
      subtitle="Define los tiempos de respuesta y resolución"
      size="lg"
      footer={
        <ModalButtons
          onCancel={onClose}
          confirmText={slaConfiguration ? 'Actualizar' : 'Crear'}
          confirmIcon={<FiSave />}
          loading={loading}
          confirmType="submit"
          formId="sla-config-form"
        />
      }
    >
      <form id="sla-config-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre y Descripción */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Ej: SLA Crítico"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prioridad *
            </label>
            <select
              required
              value={formData.priority}
              onChange={(e) => handleChange('priority', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="LOW">Bajo</option>
              <option value="MEDIUM">Medio</option>
              <option value="HIGH">Alto</option>
              <option value="CRITICAL">Crítico</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Descripción
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => handleChange('description', e.target.value || null)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Descripción de la configuración SLA"
          />
        </div>

        {/* Tiempos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tiempo de Respuesta (minutos) *
            </label>
            <input
              type="number"
              required
              min="1"
              value={formData.responseTime}
              onChange={(e) => handleChange('responseTime', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tiempo de Resolución (minutos) *
            </label>
            <input
              type="number"
              required
              min="1"
              value={formData.resolutionTime}
              onChange={(e) => handleChange('resolutionTime', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Escalamiento */}
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="escalationEnabled"
              checked={formData.escalationEnabled}
              onChange={(e) => handleChange('escalationEnabled', e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label htmlFor="escalationEnabled" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Habilitar escalamiento automático
            </label>
          </div>

          {formData.escalationEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tiempo de Escalamiento (minutos)
              </label>
              <input
                type="number"
                min="1"
                value={formData.escalationTime || ''}
                onChange={(e) => handleChange('escalationTime', parseInt(e.target.value) || null)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          )}
        </div>

        {/* Notificaciones */}
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="notifyOnBreach"
              checked={formData.notifyOnBreach}
              onChange={(e) => handleChange('notifyOnBreach', e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label htmlFor="notifyOnBreach" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Notificar cuando se incumpla el SLA
            </label>
          </div>

          {formData.notifyOnBreach && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notificar antes de (minutos)
              </label>
              <input
                type="number"
                min="1"
                value={formData.notifyBefore || ''}
                onChange={(e) => handleChange('notifyBefore', parseInt(e.target.value) || null)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          )}
        </div>

        {/* Opciones adicionales */}
        <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="businessHoursOnly"
              checked={formData.businessHoursOnly}
              onChange={(e) => handleChange('businessHoursOnly', e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label htmlFor="businessHoursOnly" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Solo horario laboral
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Configuración activa
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) => handleChange('isDefault', e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Configuración por defecto
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
}
