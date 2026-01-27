import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { FiX, FiUser, FiClock, FiAlertCircle, FiCalendar } from 'react-icons/fi';
import { KanbanTicket } from '../../services/kanban.service';
import { ticketsService } from '../../services/tickets.service';
import { formsService } from '../../services/forms.service';
import { departmentsService } from '../../services/departments.service';
import Badge from '../common/Badge';
import { BadgeVariant } from '../common/Badge';
import LoadingSpinner from '../common/LoadingSpinner';

interface TicketDetailModalProps {
  ticket: KanbanTicket;
  onClose: () => void;
  onUpdate: () => void;
  canEdit: boolean;
}

const PRIORITY_CONFIG = {
  LOW: { variant: 'success' as BadgeVariant, label: 'Baja' },
  MEDIUM: { variant: 'warning' as BadgeVariant, label: 'Media' },
  HIGH: { variant: 'orange' as BadgeVariant, label: 'Alta' },
  CRITICAL: { variant: 'danger' as BadgeVariant, label: 'Crítica' }
};

const STATUS_CONFIG = {
  NEW: { label: 'Nuevo', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  ASSIGNED: { label: 'Asignado', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  IN_PROGRESS: { label: 'En Proceso', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  WAITING: { label: 'Esperando', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  RESOLVED: { label: 'Resuelto', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' }
};

export default function TicketDetailModal({ ticket, onClose, onUpdate, canEdit }: TicketDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [departmentUsers, setDepartmentUsers] = useState<any[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<string>(ticket.assignedTo?.id || '');
  const [selectedPriority, setSelectedPriority] = useState<string>(ticket.priority);
  const [fullTicket, setFullTicket] = useState<any>(null);
  const [loadingTicket, setLoadingTicket] = useState(true);

  useEffect(() => {
    if (canEdit) {
      loadDepartmentUsers();
    }
    loadFullTicket();
  }, []);

  const loadFullTicket = async () => {
    try {
      setLoadingTicket(true);
      const data = await ticketsService.getTicketById(ticket.id);

      const tryAddFieldsToMap = (labels: Record<string, string>, fields: any[]) => {
        fields.forEach((field: any) => {
          const label = field?.label ?? field?.name ?? field?.title;
          if (field?.id && label) {
            labels[field.id] = String(label);
          }
        });
      };

      const fieldLabels: Record<string, string> = {};
      let formFields: any[] = [];

      // 1) Intentar desde el ticket (si el backend incluyó fields)
      const maybeFields = (data as any).form?.fields;
      if (Array.isArray(maybeFields) && maybeFields.length > 0) {
        tryAddFieldsToMap(fieldLabels, maybeFields);
        formFields = maybeFields;
      } else {
        // 2) Fallback: traer el formulario completo por formId
        if (Object.keys(fieldLabels).length === 0 && (data as any).formId) {
          try {
            const form = await formsService.getFormById((data as any).formId);
            if (Array.isArray((form as any).fields) && (form as any).fields.length > 0) {
              tryAddFieldsToMap(fieldLabels, (form as any).fields);
              formFields = (form as any).fields;
            }
          } catch (e) {
            // Si el usuario no tiene permisos para leer forms, solo caemos al fallback fieldId
          }
        }
      }

      setFullTicket({
        ...data,
        fieldLabels,
        formFields
      });
    } catch (error) {
      console.error('Error loading ticket:', error);
      toast.error('Error al cargar detalles del ticket');
    } finally {
      setLoadingTicket(false);
    }
  };

  const loadDepartmentUsers = async () => {
    try {
      const departmentId = ticket.department?.id;
      if (!departmentId) return;

      const response = await departmentsService.getDepartmentUsers(departmentId);
      const users = response.data?.map((du: any) => du.user) || [];
      setDepartmentUsers(users);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleAssign = async () => {
    if (!canEdit) return;
    
    try {
      setLoading(true);
      await ticketsService.updateTicket(ticket.id, {
        assignedToId: selectedAssignee || null
      });
      toast.success('Ticket asignado exitosamente');
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error assigning ticket:', error);
      toast.error('Error al asignar ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePriority = async () => {
    if (!canEdit) return;
    
    try {
      setLoading(true);
      await ticketsService.updateTicket(ticket.id, {
        priority: selectedPriority as any
      });
      toast.success('Prioridad actualizada exitosamente');
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error changing priority:', error);
      toast.error('Error al cambiar prioridad');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const priorityConfig = PRIORITY_CONFIG[ticket.priority];
  const statusConfig = STATUS_CONFIG[ticket.status];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-white">
                  {ticket.ticketNumber}
                </h3>
                <Badge variant={priorityConfig.variant}>
                  {priorityConfig.label}
                </Badge>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
            {loadingTicket ? (
              <LoadingSpinner />
            ) : (
              <div className="space-y-6">
                {/* Título */}
                <div>
                  <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {ticket.title}
                  </h4>
                </div>

                {/* Información del solicitante */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <FiUser className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Solicitante</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {ticket.requester.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {ticket.requester.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <FiCalendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Creado</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatDate(ticket.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Asignación */}
                {canEdit && (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      <FiUser className="inline w-4 h-4 mr-2" />
                      Asignar a
                    </label>
                    <div className="flex gap-3">
                      <select
                        value={selectedAssignee}
                        onChange={(e) => setSelectedAssignee(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={loading}
                      >
                        <option value="">Sin asignar</option>
                        {departmentUsers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name} - {user.email}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleAssign}
                        disabled={loading || selectedAssignee === (ticket.assignedTo?.id || '')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? 'Guardando...' : 'Asignar'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Cambiar prioridad */}
                {canEdit && (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      <FiAlertCircle className="inline w-4 h-4 mr-2" />
                      Prioridad
                    </label>
                    <div className="flex gap-3">
                      <select
                        value={selectedPriority}
                        onChange={(e) => setSelectedPriority(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={loading}
                      >
                        <option value="LOW">Baja</option>
                        <option value="MEDIUM">Media</option>
                        <option value="HIGH">Alta</option>
                        <option value="CRITICAL">Crítica</option>
                      </select>
                      <button
                        onClick={handleChangePriority}
                        disabled={loading || selectedPriority === ticket.priority}
                        className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? 'Guardando...' : 'Cambiar'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Asignado actual (solo lectura si no puede editar) */}
                {!canEdit && ticket.assignedTo && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <FiUser className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Asignado a</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {ticket.assignedTo.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {ticket.assignedTo.email}
                      </p>
                    </div>
                  </div>
                )}

                {/* Datos del formulario */}
                <div className="space-y-3">
                  <h5 className="font-semibold text-gray-900 dark:text-white">
                    Detalles del Formulario
                  </h5>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                    {Array.isArray(fullTicket?.formFields) && fullTicket.formFields.length > 0 ? (
                      fullTicket.formFields.map((field: any) => {
                        const value = fullTicket?.formData?.[field.id];

                        return (
                          <div key={field.id} className="border-b border-gray-200 dark:border-gray-600 pb-3 last:border-0 last:pb-0">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              {field.label || field.name || field.title || field.id}
                              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                            </p>
                            <div className="text-gray-900 dark:text-white">
                              {field.fieldType?.type === 'FILE' && value ? (
                                <a
                                  href={value}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  Ver archivo adjunto
                                </a>
                              ) : field.fieldType?.type === 'CHECKBOX' ? (
                                <span>{value ? 'Sí' : 'No'}</span>
                              ) : field.fieldType?.type === 'SELECT' || field.fieldType?.type === 'RADIO' ? (
                                <span>{field.options?.find((opt: any) => opt.value === value)?.label || value || '-'}</span>
                              ) : (
                                <span className="whitespace-pre-wrap">{value || '-'}</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : fullTicket?.formData && Object.keys(fullTicket.formData).length > 0 ? (
                      Object.entries(fullTicket.formData).map(([fieldId, value]: [string, any]) => {
                        const fieldLabel = fullTicket.fieldLabels?.[fieldId] || fieldId;
                        return (
                          <div key={fieldId} className="border-b border-gray-200 dark:border-gray-600 pb-3 last:border-0 last:pb-0">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              {fieldLabel}
                            </p>
                            <p className="text-gray-900 dark:text-white">
                              {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                        No hay campos de formulario
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4">
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <FiClock className="w-4 h-4" />
                <span>Última actualización: {formatDate(ticket.updatedAt)}</span>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
