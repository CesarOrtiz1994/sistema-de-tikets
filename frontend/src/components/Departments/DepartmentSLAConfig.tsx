import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import Card from '../common/Card';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import ConfirmDialog from '../common/ConfirmDialog';
import Modal from '../common/Modal';
import ModalButtons from '../common/ModalButtons';
import ValidationError from '../common/ValidationError';
import Badge from '../common/Badge';
import { FiClock, FiPlus, FiTrash2, FiEdit2, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import departmentSLAService, { DepartmentSLA, SLAPriority } from '../../services/departmentSLA.service';
import api from '../../services/api';
import { createDepartmentSLASchema, CreateDepartmentSLAFormData } from '../../validators/department.validator';
import { z } from 'zod';

interface GlobalSLAConfig {
  id: string;
  name: string;
  description: string | null;
  priority: SLAPriority;
  responseTime: number;
  resolutionTime: number;
  escalationEnabled: boolean;
  escalationTime: number | null;
  businessHoursOnly: boolean;
  notifyOnBreach: boolean;
  notifyBefore: number | null;
  isDefault: boolean;
}

interface DepartmentSLAConfigProps {
  departmentId: string;
  onUpdate?: () => void;
}

const priorityLabels: Record<SLAPriority, string> = {
  LOW: 'Bajo',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica'
};

const priorityColors: Record<SLAPriority, string> = {
  LOW: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  MEDIUM: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
};

const priorityBorderColors: Record<SLAPriority, string> = {
  LOW: 'border-l-4 border-l-green-500',
  MEDIUM: 'border-l-4 border-l-blue-500',
  HIGH: 'border-l-4 border-l-orange-500',
  CRITICAL: 'border-l-4 border-l-red-500'
};

const initialFormData: CreateDepartmentSLAFormData = {
  priority: 'MEDIUM',
  name: '',
  description: '',
  responseTime: 60,
  resolutionTime: 480,
  businessHoursOnly: true,
  escalationEnabled: false,
  escalationTime: null,
  notifyOnBreach: true,
  notifyBefore: 30,
  isDefault: false
};

export default function DepartmentSLAConfig({ departmentId, onUpdate }: DepartmentSLAConfigProps) {
  const [slas, setSlas] = useState<DepartmentSLA[]>([]);
  const [globalSLAs, setGlobalSLAs] = useState<GlobalSLAConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPriority, setEditingPriority] = useState<SLAPriority | null>(null);
  const [formData, setFormData] = useState<CreateDepartmentSLAFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const { isOpen, options, confirm, handleConfirm, handleCancel } = useConfirmDialog();

  useEffect(() => {
    loadData();
  }, [departmentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [slasData, globalData] = await Promise.all([
        departmentSLAService.getDepartmentSLAs(departmentId),
        api.get('/api/sla-configurations').then(r => r.data).catch(() => [])
      ]);
      setSlas(Array.isArray(slasData) ? slasData : []);
      setGlobalSLAs(Array.isArray(globalData) ? globalData : []);
    } catch (error) {
      console.error('Error al cargar SLAs:', error);
      toast.error('Error al cargar la configuración de SLA');
      setSlas([]);
    } finally {
      setLoading(false);
    }
  };

  const getGlobalSLAForPriority = (priority: SLAPriority): GlobalSLAConfig | undefined => {
    return globalSLAs.find(g => g.priority === priority);
  };

  const handleOpenModal = (priority?: SLAPriority, existingSLA?: DepartmentSLA) => {
    if (existingSLA) {
      // Modo edición
      setEditingPriority(existingSLA.priority);
      setFormData({
        priority: existingSLA.priority,
        name: existingSLA.name,
        description: existingSLA.description || '',
        responseTime: existingSLA.response_time,
        resolutionTime: existingSLA.resolution_time,
        businessHoursOnly: existingSLA.business_hours_only,
        escalationEnabled: existingSLA.escalation_enabled,
        escalationTime: existingSLA.escalation_time,
        notifyOnBreach: existingSLA.notify_on_breach,
        notifyBefore: existingSLA.notify_before,
        isDefault: existingSLA.is_default
      });
    } else {
      // Modo creación - usar la primera prioridad disponible
      setEditingPriority(null);
      const availablePriorities = getAvailablePriorities();
      const defaultPriority = priority || availablePriorities[0] || 'MEDIUM';
      setFormData({
        ...initialFormData,
        priority: defaultPriority
      });
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validatedData = createDepartmentSLASchema.parse(formData);

      // Verificar si ya existe SLA para esta prioridad (solo en modo creación)
      if (!editingPriority) {
        const existingSLA = slas.find(s => s.priority === validatedData.priority);
        if (existingSLA) {
          toast.error(`Ya existe una configuración SLA para la prioridad ${priorityLabels[validatedData.priority]}`);
          return;
        }
      }

      setSubmitting(true);

      const dataToSend = {
        priority: validatedData.priority,
        name: validatedData.name,
        description: validatedData.description,
        responseTime: validatedData.responseTime,
        resolutionTime: validatedData.resolutionTime,
        businessHoursOnly: validatedData.businessHoursOnly,
        escalationEnabled: validatedData.escalationEnabled,
        escalationTime: validatedData.escalationTime,
        notifyOnBreach: validatedData.notifyOnBreach,
        notifyBefore: validatedData.notifyBefore,
        isDefault: validatedData.isDefault
      };

      // Enviar datos completos al backend
      await departmentSLAService.assignSLAToDepartment(departmentId, dataToSend);

      toast.success(editingPriority ? 'SLA actualizado exitosamente' : 'SLA creado exitosamente');
      setIsModalOpen(false);
      await loadData();
      onUpdate?.();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            validationErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(validationErrors);
        toast.error('Por favor corrige los errores en el formulario');
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Error al guardar SLA';
        toast.error(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveSLA = async (priority: SLAPriority) => {
    const confirmed = await confirm({
      title: 'Eliminar SLA',
      message: `¿Estás seguro de que deseas eliminar la configuración SLA para la prioridad ${priorityLabels[priority]}?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar'
    });

    if (!confirmed) return;

    try {
      await departmentSLAService.removeSLAFromDepartment(departmentId, priority);
      toast.success('SLA eliminado exitosamente');
      await loadData();
      onUpdate?.();
    } catch (error) {
      console.error('Error al eliminar SLA:', error);
      toast.error('Error al eliminar SLA');
    }
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const getAvailablePriorities = (): SLAPriority[] => {
    const allPriorities: SLAPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const usedPriorities = slas.map(s => s.priority);
    return allPriorities.filter(p => !usedPriorities.includes(p));
  };

  if (loading) {
    return (
      <Card>
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Configuración de SLA
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Define los tiempos de respuesta y resolución según la prioridad del ticket
              </p>
            </div>
            <button
              onClick={() => handleOpenModal()}
              disabled={getAvailablePriorities().length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-brand-gradient bg-brand-gradient-hover text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FiPlus />
              Crear SLA
            </button>
          </div>

          {/* Valores por defecto del sistema */}
          {globalSLAs.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <FiAlertCircle className="text-blue-500" />
                Valores por defecto del sistema (referencia)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as SLAPriority[]).map((priority) => {
                  const global = getGlobalSLAForPriority(priority);
                  const hasDeptSLA = slas.some(s => (s.priority as string).toUpperCase() === priority);
                  return (
                    <div
                      key={priority}
                      className={`rounded-lg p-3 border ${priorityBorderColors[priority]} ${
                        hasDeptSLA
                          ? 'bg-gray-50 dark:bg-gray-800 opacity-60'
                          : 'bg-white dark:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={priorityColors[priority]}>
                          {priorityLabels[priority]}
                        </Badge>
                        {hasDeptSLA && (
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">Personalizado</span>
                        )}
                      </div>
                      {global ? (
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={global.name}>{global.name}</p>
                          <div className="flex items-center gap-3 text-xs">
                            <div>
                              <span className="text-gray-400">Resp: </span>
                              <span className="font-semibold text-gray-700 dark:text-gray-200">{formatTime(global.responseTime)}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Res: </span>
                              <span className="font-semibold text-gray-700 dark:text-gray-200">{formatTime(global.resolutionTime)}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">Sin valor global</p>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Estos son los valores globales del sistema. Si no configuras un SLA personalizado para una prioridad, se usarán estos valores.
              </p>
            </div>
          )}

          {slas.length === 0 ? (
            <EmptyState
              icon={FiClock}
              title="No hay SLAs personalizados"
              description="Se están usando los valores por defecto del sistema. Crea configuraciones SLA personalizadas si necesitas tiempos diferentes."
            />
          ) : (
            <div className="space-y-4">
              {slas.map((sla) => {
                const priority = (sla.priority as string).toUpperCase() as SLAPriority;
                return (
                  <div
                    key={sla.id}
                    className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${priorityBorderColors[priority]}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge className={priorityColors[priority]}>
                            {priorityLabels[priority]}
                          </Badge>
                        {sla.is_default && (
                          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            Por defecto
                          </Badge>
                        )}
                        {sla.is_active ? (
                          <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                            <FiCheckCircle />
                            Activo
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <FiAlertCircle />
                            Inactivo
                          </span>
                        )}
                      </div>

                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {sla.name}
                      </h4>
                      {sla.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {sla.description}
                        </p>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Tiempo de Respuesta
                          </p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatTime(sla.response_time)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Tiempo de Resolución
                          </p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatTime(sla.resolution_time)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Horario Laboral
                          </p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {sla.business_hours_only ? 'Sí' : 'No'}
                          </p>
                        </div>
                        {sla.escalation_enabled && sla.escalation_time && (
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Escalamiento
                            </p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {formatTime(sla.escalation_time)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleOpenModal(sla.priority, sla)}
                        className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400 p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Editar SLA"
                      >
                        <FiEdit2 size={20} />
                      </button>
                      <button
                        onClick={() => handleRemoveSLA(sla.priority)}
                        className="text-red-600 hover:text-red-900 dark:hover:text-red-400 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Eliminar SLA"
                      >
                        <FiTrash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Modal para crear/editar SLA */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPriority ? 'Editar SLA' : 'Crear SLA'}
        footer={
          <ModalButtons
            onCancel={() => setIsModalOpen(false)}
            confirmText={editingPriority ? 'Actualizar SLA' : 'Crear SLA'}
            cancelText="Cancelar"
            loading={submitting}
            confirmType="submit"
            formId="sla-form"
          />
        }
      >
        <form id="sla-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Prioridad */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prioridad <span className="text-red-500">*</span>
            </label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as SLAPriority })}
              disabled={!!editingPriority}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingPriority ? (
                <option value={editingPriority}>{priorityLabels[editingPriority]}</option>
              ) : (
                <>
                  <option value="">Selecciona una prioridad</option>
                  {getAvailablePriorities().map((priority) => (
                    <option key={priority} value={priority}>
                      {priorityLabels[priority]}
                    </option>
                  ))}
                </>
              )}
            </select>
            <ValidationError message={errors.priority} />
          </div>

          {/* Nombre */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Ej: SLA Estándar - Prioridad Media"
            />
            <ValidationError message={errors.name} />
          </div>

          {/* Descripción */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Descripción opcional de esta configuración SLA"
              maxLength={500}
            />
            <ValidationError message={errors.description} />
          </div>

          {/* Tiempos */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="responseTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tiempo de Respuesta (minutos) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="responseTime"
                value={formData.responseTime}
                onChange={(e) => setFormData({ ...formData, responseTime: parseInt(e.target.value) || 0 })}
                min="1"
                max="10080"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formatTime(formData.responseTime)}
              </p>
              <ValidationError message={errors.responseTime} />
            </div>

            <div>
              <label htmlFor="resolutionTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tiempo de Resolución (minutos) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="resolutionTime"
                value={formData.resolutionTime}
                onChange={(e) => setFormData({ ...formData, resolutionTime: parseInt(e.target.value) || 0 })}
                min="1"
                max="43200"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formatTime(formData.resolutionTime)}
              </p>
              <ValidationError message={errors.resolutionTime} />
            </div>
          </div>

          {/* Opciones booleanas */}
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  id="businessHoursOnly"
                  checked={formData.businessHoursOnly}
                  onChange={(e) => setFormData({ ...formData, businessHoursOnly: e.target.checked })}
                  className="w-4 h-4 text-purple-600 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="businessHoursOnly" className="font-medium text-gray-700 dark:text-gray-300">
                  Solo horario laboral
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Los tiempos se calculan solo durante el horario laboral del departamento
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  id="notifyOnBreach"
                  checked={formData.notifyOnBreach}
                  onChange={(e) => setFormData({ ...formData, notifyOnBreach: e.target.checked })}
                  className="w-4 h-4 text-purple-600 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="notifyOnBreach" className="font-medium text-gray-700 dark:text-gray-300">
                  Notificar al exceder SLA
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Enviar notificación cuando se exceda el tiempo de SLA
                </p>
              </div>
            </div>

            {formData.notifyOnBreach && (
              <div className="ml-7">
                <label htmlFor="notifyBefore" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notificar antes de (minutos)
                </label>
                <input
                  type="number"
                  id="notifyBefore"
                  value={formData.notifyBefore || ''}
                  onChange={(e) => setFormData({ ...formData, notifyBefore: parseInt(e.target.value) || null })}
                  min="1"
                  max="1440"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="30"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Notificar preventivamente antes de que se exceda el SLA
                </p>
                <ValidationError message={errors.notifyBefore} />
              </div>
            )}

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  id="escalationEnabled"
                  checked={formData.escalationEnabled}
                  onChange={(e) => setFormData({ ...formData, escalationEnabled: e.target.checked })}
                  className="w-4 h-4 text-purple-600 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="escalationEnabled" className="font-medium text-gray-700 dark:text-gray-300">
                  Habilitar escalamiento
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Escalar el ticket automáticamente después de cierto tiempo
                </p>
              </div>
            </div>

            {formData.escalationEnabled && (
              <div className="ml-7">
                <label htmlFor="escalationTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tiempo de escalamiento (minutos) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="escalationTime"
                  value={formData.escalationTime || ''}
                  onChange={(e) => setFormData({ ...formData, escalationTime: parseInt(e.target.value) || null })}
                  min="1"
                  max="10080"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                {formData.escalationTime && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatTime(formData.escalationTime)}
                  </p>
                )}
                <ValidationError message={errors.escalationTime} />
              </div>
            )}

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="w-4 h-4 text-purple-600 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="isDefault" className="font-medium text-gray-700 dark:text-gray-300">
                  Marcar como SLA predeterminado
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Este SLA se aplicará a tickets sin prioridad específica
                </p>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isOpen}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        {...options}
      />
    </>
  );
}
