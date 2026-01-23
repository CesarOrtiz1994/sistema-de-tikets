import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { FiClock, FiAlertCircle, FiCheckCircle, FiZap, FiTrash2, FiSave } from 'react-icons/fi';
import Modal from '../common/Modal';
import Card from '../common/Card';
import Badge from '../common/Badge';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import ConfirmDialog from '../common/ConfirmDialog';
import departmentSLAService, { DepartmentSLA, SLAPriority, AssignSLAData } from '../../services/departmentSLA.service';
import api from '../../services/api';
import { validateForm, assignSLASchema } from '../../utils/validationSchemas';

interface SLAConfiguration {
  id: string;
  name: string;
  description: string | null;
  responseTime: number;
  resolutionTime: number;
  isActive: boolean;
}

interface DepartmentSLAModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentId: string;
  departmentName: string;
}

const PRIORITY_CONFIG = {
  LOW: {
    label: 'Baja',
    color: 'green' as const,
    icon: FiCheckCircle,
    bgClass: 'bg-green-50 dark:bg-green-900/20',
    borderClass: 'border-green-200 dark:border-green-700'
  },
  MEDIUM: {
    label: 'Media',
    color: 'yellow' as const,
    icon: FiClock,
    bgClass: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderClass: 'border-yellow-200 dark:border-yellow-700'
  },
  HIGH: {
    label: 'Alta',
    color: 'orange' as const,
    icon: FiZap,
    bgClass: 'bg-orange-50 dark:bg-orange-900/20',
    borderClass: 'border-orange-200 dark:border-orange-700'
  },
  CRITICAL: {
    label: 'Crítica',
    color: 'red' as const,
    icon: FiAlertCircle,
    bgClass: 'bg-red-50 dark:bg-red-900/20',
    borderClass: 'border-red-200 dark:border-red-700'
  }
};

const formatTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}min`;
};

export default function DepartmentSLAModal({
  isOpen,
  onClose,
  departmentId,
  departmentName
}: DepartmentSLAModalProps) {
  const [departmentSLAs, setDepartmentSLAs] = useState<DepartmentSLA[]>([]);
  const [availableSLAs, setAvailableSLAs] = useState<SLAConfiguration[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<SLAPriority | null>(null);
  const [selectedSLAId, setSelectedSLAId] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { isOpen: confirmIsOpen, options, confirm, handleConfirm, handleCancel } = useConfirmDialog();

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, departmentId]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadDepartmentSLAs(),
        loadAvailableSLAs()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar configuraciones SLA');
    } finally {
      setLoading(false);
    }
  };

  const loadDepartmentSLAs = async () => {
    try {
      const slas = await departmentSLAService.getDepartmentSLAs(departmentId);
      setDepartmentSLAs(slas);
    } catch (error) {
      console.error('Error loading department SLAs:', error);
    }
  };

  const loadAvailableSLAs = async () => {
    try {
      const response = await api.get('/api/sla-configurations');
      setAvailableSLAs(response.data.filter((sla: SLAConfiguration) => sla.isActive));
    } catch (error) {
      console.error('Error loading available SLAs:', error);
    }
  };

  const handleAssignSLA = async () => {
    if (!selectedPriority || !selectedSLAId) {
      toast.warning('Selecciona una prioridad y una configuración SLA');
      return;
    }

    const data: AssignSLAData = {
      slaConfigurationId: selectedSLAId,
      priority: selectedPriority,
      isDefault
    };

    const result = validateForm(assignSLASchema, data);
    if (!result.success) {
      setErrors(result.errors);
      toast.warning('Por favor completa todos los campos correctamente');
      return;
    }

    try {
      await departmentSLAService.assignSLAToDepartment(departmentId, data);
      toast.success('Configuración SLA asignada exitosamente');
      await loadDepartmentSLAs();
      resetForm();
    } catch (error) {
      console.error('Error assigning SLA:', error);
      toast.error('Error al asignar configuración SLA');
    }
  };

  const handleRemoveSLA = async (priority: SLAPriority) => {
    const confirmed = await confirm({
      title: 'Eliminar Configuración SLA',
      message: `¿Estás seguro de eliminar la configuración SLA para prioridad ${PRIORITY_CONFIG[priority].label}?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    });

    if (!confirmed) return;

    try {
      await departmentSLAService.removeSLAFromDepartment(departmentId, priority);
      toast.success('Configuración SLA eliminada exitosamente');
      await loadDepartmentSLAs();
    } catch (error) {
      console.error('Error removing SLA:', error);
      toast.error('Error al eliminar configuración SLA');
    }
  };

  const resetForm = () => {
    setSelectedPriority(null);
    setSelectedSLAId('');
    setIsDefault(false);
    setErrors({});
  };

  const getSLAForPriority = (priority: SLAPriority): DepartmentSLA | undefined => {
    return departmentSLAs.find(sla => sla.priority === priority);
  };

  const priorities: SLAPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Configuración SLA - ${departmentName}`}
        size="xl"
      >
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              {/* Configuraciones actuales */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Configuraciones Actuales
                </h3>
                
                {departmentSLAs.length === 0 ? (
                  <EmptyState
                    icon={FiClock}
                    title="Sin configuraciones SLA"
                    description="No hay configuraciones SLA asignadas a este departamento"
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {priorities.map(priority => {
                      const sla = getSLAForPriority(priority);
                      const config = PRIORITY_CONFIG[priority];
                      const Icon = config.icon;

                      return (
                        <Card key={priority}>
                          <div className={`p-4 rounded-lg border ${config.bgClass} ${config.borderClass}`}>
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Icon className={`text-${config.color}-600`} size={20} />
                                <Badge variant={config.color} size="sm">
                                  {config.label}
                                </Badge>
                              </div>
                              {sla && (
                                <button
                                  onClick={() => handleRemoveSLA(priority)}
                                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                  title="Eliminar configuración"
                                >
                                  <FiTrash2 size={16} />
                                </button>
                              )}
                            </div>

                            {sla ? (
                              <div className="space-y-2">
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {sla.name}
                                </p>
                                {sla.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {sla.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-600 dark:text-gray-400">Respuesta: </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {formatTime(sla.response_time)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600 dark:text-gray-400">Resolución: </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {formatTime(sla.resolution_time)}
                                    </span>
                                  </div>
                                </div>
                                {sla.is_default && (
                                  <Badge variant="blue" size="sm">Por defecto</Badge>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                Sin configuración asignada
                              </p>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Formulario de asignación */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Asignar Nueva Configuración
                </h3>
                
                <Card>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Prioridad
                      </label>
                      <select
                        value={selectedPriority || ''}
                        onChange={(e) => setSelectedPriority(e.target.value as SLAPriority)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="">Selecciona una prioridad</option>
                        {priorities.map(priority => (
                          <option key={priority} value={priority}>
                            {PRIORITY_CONFIG[priority].label}
                          </option>
                        ))}
                      </select>
                      {errors.priority && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.priority}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Configuración SLA
                      </label>
                      <select
                        value={selectedSLAId}
                        onChange={(e) => setSelectedSLAId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="">Selecciona una configuración SLA</option>
                        {availableSLAs.map(sla => (
                          <option key={sla.id} value={sla.id}>
                            {sla.name} - Respuesta: {formatTime(sla.responseTime)} / Resolución: {formatTime(sla.resolutionTime)}
                          </option>
                        ))}
                      </select>
                      {errors.slaConfigurationId && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.slaConfigurationId}</p>
                      )}
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isDefault"
                        checked={isDefault}
                        onChange={(e) => setIsDefault(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Marcar como configuración por defecto
                      </label>
                    </div>

                    <button
                      onClick={handleAssignSLA}
                      disabled={!selectedPriority || !selectedSLAId}
                      className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <FiSave />
                      <span>Asignar Configuración</span>
                    </button>
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
          >
            Cerrar
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmIsOpen}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
        title={options.title}
        message={options.message}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        type={options.type}
      />
    </>
  );
}
