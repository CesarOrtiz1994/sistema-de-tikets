import { useState, useEffect } from 'react';
import { FiClock, FiAlertCircle, FiCheckCircle, FiZap, FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import SLAConfigurationModal from '../components/SLA/SLAConfigurationModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { usePermissions } from '../hooks/usePermissions';
import { RoleType } from '../types/permissions';
import api from '../services/api';
import { toast } from 'sonner';

interface SLAConfiguration {
  id: string;
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

const priorityConfig = {
  CRITICAL: {
    label: 'Crítico',
    color: 'red' as const,
    icon: FiAlertCircle,
    bgClass: 'bg-red-50 dark:bg-red-900/20'
  },
  HIGH: {
    label: 'Alto',
    color: 'orange' as const,
    icon: FiZap,
    bgClass: 'bg-orange-50 dark:bg-orange-900/20'
  },
  MEDIUM: {
    label: 'Medio',
    color: 'blue' as const,
    icon: FiClock,
    bgClass: 'bg-blue-50 dark:bg-blue-900/20'
  },
  LOW: {
    label: 'Bajo',
    color: 'green' as const,
    icon: FiCheckCircle,
    bgClass: 'bg-green-50 dark:bg-green-900/20'
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

export default function SLAConfigurationsPage() {
  const [slaConfigurations, setSlaConfigurations] = useState<SLAConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSLA, setSelectedSLA] = useState<SLAConfiguration | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [slaToDelete, setSlaToDelete] = useState<string | null>(null);
  const { hasRole } = usePermissions();
  const isSuperAdmin = hasRole(RoleType.SUPER_ADMIN);

  useEffect(() => {
    fetchSLAConfigurations();
  }, []);

  const fetchSLAConfigurations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/sla-configurations');
      setSlaConfigurations(response.data);
    } catch (error) {
      console.error('Error fetching SLA configurations:', error);
      toast.error('Error al cargar configuraciones SLA');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedSLA(null);
    setIsModalOpen(true);
  };

  const handleEdit = (sla: SLAConfiguration) => {
    setSelectedSLA(sla);
    setIsModalOpen(true);
  };

  const handleSave = async (data: Partial<SLAConfiguration>) => {
    try {
      if (selectedSLA) {
        await api.put(`/api/sla-configurations/${selectedSLA.id}`, data);
        toast.success('Configuración SLA actualizada correctamente');
      } else {
        await api.post('/api/sla-configurations', data);
        toast.success('Configuración SLA creada correctamente');
      }
      fetchSLAConfigurations();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Error saving SLA configuration:', error);
      toast.error(error.response?.data?.message || 'Error al guardar configuración SLA');
      throw error;
    }
  };

  const handleDeleteClick = (id: string) => {
    setSlaToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!slaToDelete) return;

    try {
      await api.delete(`/api/sla-configurations/${slaToDelete}`);
      toast.success('Configuración SLA eliminada correctamente');
      fetchSLAConfigurations();
    } catch (error: any) {
      console.error('Error deleting SLA configuration:', error);
      toast.error(error.response?.data?.message || 'Error al eliminar configuración SLA');
    } finally {
      setIsConfirmOpen(false);
      setSlaToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuraciones SLA"
        description="Gestiona los acuerdos de nivel de servicio para tickets"
        action={
          isSuperAdmin ? (
            <button 
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-200"
            >
              <FiPlus />
              Nueva Configuración SLA
            </button>
          ) : undefined
        }
      />

      {loading ? (
        <LoadingSpinner text="Cargando configuraciones SLA..." />
      ) : slaConfigurations.length === 0 ? (
        <EmptyState
          icon={FiClock}
          title="No hay configuraciones SLA"
          description="Crea tu primera configuración SLA para gestionar tiempos de respuesta"
          action={
            isSuperAdmin ? (
              <button 
                onClick={handleCreate}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <FiPlus className="inline mr-2" />
                Crear Configuración SLA
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {slaConfigurations.map((sla) => {
            const config = priorityConfig[sla.priority];
            const Icon = config.icon;

            return (
              <Card key={sla.id} className={config.bgClass}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-white dark:bg-gray-800`}>
                      <Icon className={`text-2xl text-${config.color}-600`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {sla.name}
                        </h3>
                        {sla.isDefault && (
                          <Badge variant="purple" size="sm">
                            Por defecto
                          </Badge>
                        )}
                      </div>
                      <Badge variant={config.color} size="sm" className="mt-1">
                        {config.label}
                      </Badge>
                    </div>
                  </div>

                  {isSuperAdmin && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(sla)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(sla.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  )}
                </div>

                {sla.description && (
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {sla.description}
                  </p>
                )}

                <div className="space-y-3">
                  {/* Tiempos */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Tiempo de respuesta
                      </div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatTime(sla.responseTime)}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Tiempo de resolución
                      </div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatTime(sla.resolutionTime)}
                      </div>
                    </div>
                  </div>

                  {/* Escalamiento */}
                  {sla.escalationEnabled && sla.escalationTime && (
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Escalamiento automático
                        </span>
                        <Badge variant="warning" size="sm">
                          {formatTime(sla.escalationTime)}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Configuraciones adicionales */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    {sla.businessHoursOnly && (
                      <Badge variant="gray" size="sm">
                        Solo horario laboral
                      </Badge>
                    )}
                    {sla.notifyOnBreach && (
                      <Badge variant="info" size="sm">
                        Notificaciones activas
                      </Badge>
                    )}
                    {sla.notifyBefore && (
                      <Badge variant="blue" size="sm">
                        Alerta {formatTime(sla.notifyBefore)} antes
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <SLAConfigurationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        slaConfiguration={selectedSLA}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Configuración SLA"
        message="¿Estás seguro de que deseas eliminar esta configuración SLA? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
}
