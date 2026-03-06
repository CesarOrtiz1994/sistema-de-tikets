import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { FiX, FiUser, FiClock, FiAlertCircle, FiCalendar, FiFileText, FiMessageSquare, FiPaperclip, FiPackage, FiDownload } from 'react-icons/fi';
import { KanbanTicket } from '../../services/kanban.service';
import { ticketsService } from '../../services/tickets.service';
import { formsService } from '../../services/forms.service';
import { departmentsService } from '../../services/departments.service';
import { deliverablesService } from '../../services/deliverables.service';
import { Deliverable, DeliverableStatus } from '../../types/deliverable';
import Badge from '../common/Badge';
import UnreadBadge from '../common/UnreadBadge';
import { BadgeVariant } from '../common/Badge';
import LoadingSpinner from '../common/LoadingSpinner';
import ChatWindow from '../Chat/ChatWindow';
import FileHistory from '../Chat/FileHistory';
import { useUnreadMessages } from '../../contexts/UnreadMessagesContext';

interface TicketDetailModalProps {
  ticket: KanbanTicket;
  onClose: () => void;
  onUpdate: () => void;
  canEdit: boolean;
}

const PRIORITY_CONFIG = {
  LOW: { variant: 'success' as BadgeVariant, label: 'Bajo' },
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

type TabType = 'details' | 'chat' | 'files';

export default function TicketDetailModal({ ticket, onClose, onUpdate, canEdit }: TicketDetailModalProps) {
  const { unreadCounts } = useUnreadMessages();
  const [loading, setLoading] = useState(false);
  const [departmentUsers, setDepartmentUsers] = useState<any[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>(ticket.assignments?.map(a => a.user.id) || []);
  const [selectedPriority, setSelectedPriority] = useState<string>(ticket.priority);
  const [fullTicket, setFullTicket] = useState<any>(null);
  const [loadingTicket, setLoadingTicket] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  
  const unreadCount = unreadCounts[ticket.id] || 0;

  useEffect(() => {
    if (canEdit) {
      loadDepartmentUsers();
    }
    loadFullTicket();
    if (ticket.department?.requireDeliverable) {
      loadDeliverables();
    }
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

  const loadDeliverables = async () => {
    try {
      const data = await deliverablesService.getTicketDeliverables(ticket.id);
      setDeliverables(data);
    } catch (error) {
      console.error('Error loading deliverables:', error);
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
      await ticketsService.assignTicket(ticket.id, selectedAssignees);
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

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('details')}
                className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'details'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <FiFileText className="w-4 h-4" />
                Detalles
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'chat'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <FiMessageSquare className="w-4 h-4" />
                Chat
                {unreadCount > 0 && <UnreadBadge count={unreadCount} />}
              </button>
              <button
                onClick={() => setActiveTab('files')}
                className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'files'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <FiPaperclip className="w-4 h-4" />
                Archivos
              </button>
            </nav>
          </div>

          {/* Body */}
          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
            {loadingTicket ? (
              <LoadingSpinner />
            ) : (
              <>
                {/* Tab: Detalles */}
                {activeTab === 'details' && (
                  <div className="space-y-6">
                {/* Título */}
                <div>
                  <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {ticket.title}
                  </h4>
                </div>

                {/* Banner Motivo de Espera */}
                {fullTicket?.status === 'WAITING' && fullTicket?.waitingReason && (
                  <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <FiClock className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">
                        Ticket en espera
                      </p>
                      <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                        {fullTicket.waitingReason}
                      </p>
                    </div>
                  </div>
                )}

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

                {/* SLA Deadline */}
                {ticket.slaDeadline && (
                  <div className={`flex items-center gap-3 p-4 rounded-lg border-2 ${
                    ticket.slaExceeded 
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700' 
                      : new Date(ticket.slaDeadline) < new Date(Date.now() + 24 * 60 * 60 * 1000)
                        ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700'
                        : 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                  }`}>
                    <FiClock className={`w-5 h-5 ${
                      ticket.slaExceeded 
                        ? 'text-red-600 dark:text-red-400' 
                        : new Date(ticket.slaDeadline) < new Date(Date.now() + 24 * 60 * 60 * 1000)
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-green-600 dark:text-green-400'
                    }`} />
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        ticket.slaExceeded 
                          ? 'text-red-700 dark:text-red-300' 
                          : new Date(ticket.slaDeadline) < new Date(Date.now() + 24 * 60 * 60 * 1000)
                            ? 'text-orange-700 dark:text-orange-300'
                            : 'text-green-700 dark:text-green-300'
                      }`}>
                        {ticket.slaExceeded ? '⚠️ SLA Excedido' : '⏰ Fecha de Entrega Estimada'}
                      </p>
                      <p className={`font-bold ${
                        ticket.slaExceeded 
                          ? 'text-red-900 dark:text-red-200' 
                          : new Date(ticket.slaDeadline) < new Date(Date.now() + 24 * 60 * 60 * 1000)
                            ? 'text-orange-900 dark:text-orange-200'
                            : 'text-green-900 dark:text-green-200'
                      }`}>
                        {formatDate(ticket.slaDeadline)}
                      </p>
                      {ticket.slaPausedAt && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          ⏸️ SLA pausado temporalmente
                        </p>
                      )}
                    </div>
                    {ticket.slaExceeded && (
                      <FiAlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                )}

                {/* Asignación */}
                {canEdit && (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      <FiUser className="inline w-4 h-4 mr-2" />
                      Asignar a (múltiple)
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
                      💡 Mantén presionado <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">Ctrl</kbd> (Windows/Linux) o <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">Cmd</kbd> (Mac) para seleccionar múltiples usuarios
                    </p>
                    <div className="flex gap-3">
                      <select
                        multiple
                        value={selectedAssignees}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, option => option.value);
                          setSelectedAssignees(selected);
                        }}
                        className="flex-1 px-4 py-2 border-2 border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px]"
                        disabled={loading}
                      >
                        {departmentUsers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name} - {user.email}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleAssign}
                        disabled={loading || JSON.stringify(selectedAssignees.sort()) === JSON.stringify((ticket.assignments?.map(a => a.user.id) || []).sort())}
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
                {!canEdit && ticket.assignments && ticket.assignments.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Asignado a</p>
                    <div className="space-y-2">
                      {ticket.assignments.map(assignment => (
                        <div key={assignment.user.id} className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                            {assignment.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {assignment.user.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {assignment.user.email}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Estado del Entregable */}
                {ticket.department?.requireDeliverable && fullTicket && (() => {
                  const pending = deliverables.find(d => d.status === DeliverableStatus.PENDING);
                  const lastRejected = deliverables.find(d => d.status === DeliverableStatus.REJECTED);
                  const approved = deliverables.some(d => d.status === DeliverableStatus.APPROVED);
                  const rejections = fullTicket.deliverableRejections || 0;
                  const maxRejections = fullTicket.department?.maxDeliverableRejections ?? 3;
                  const remaining = maxRejections - rejections;

                  return (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <FiPackage className="w-4 h-4" />
                          Entregable
                        </h5>
                        {approved ? (
                          <Badge variant="success" size="sm">Aprobado</Badge>
                        ) : pending ? (
                          <Badge variant="warning" size="sm">Pendiente de Revisión</Badge>
                        ) : lastRejected ? (
                          <Badge variant="danger" size="sm">Rechazado</Badge>
                        ) : (
                          <Badge variant="gray" size="sm">Sin entregable</Badge>
                        )}
                      </div>

                      {approved ? (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                          <p className="text-sm text-green-700 dark:text-green-300">
                            {fullTicket.department?.requireRating
                              ? 'El entregable fue aprobado. En espera de que el solicitante cierre y califique el ticket. Puedes ver el entregable en la seción de entregables.'
                              : 'El entregable fue aprobado. En espera de que el solicitante cierre el ticket. Puedes ver el entregable en la seción de entregables.'}
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Rechazos */}
                          {rejections > 0 && (
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Rechazos realizados</div>
                                <div className="text-lg font-bold text-gray-900 dark:text-white">
                                  {rejections} <span className="text-sm font-normal text-gray-500">/ {maxRejections}</span>
                                </div>
                              </div>
                              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Intentos restantes</div>
                                <div className={`text-lg font-bold ${remaining <= 1 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                                  {remaining}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Motivo del último rechazo */}
                          {lastRejected && lastRejected.rejectionReason && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                              <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">Motivo del último rechazo:</p>
                              <p className="text-sm text-red-600 dark:text-red-400">{lastRejected.rejectionReason}</p>
                              {lastRejected.reviewedBy && (
                                <p className="text-xs text-red-500 dark:text-red-500 mt-1">
                                  Por {lastRejected.reviewedBy.name} • {new Date(lastRejected.reviewedAt!).toLocaleDateString('es-MX')}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Archivo pendiente */}
                          {pending && (
                            <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                              <FiPackage className="w-4 h-4 text-purple-600" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{pending.fileName}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Subido el {new Date(pending.createdAt).toLocaleDateString('es-MX')}
                                </p>
                              </div>
                              <a
                                href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${pending.fileUrl}`}
                                download
                                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Descargar"
                              >
                                <FiDownload className="w-4 h-4" />
                              </a>
                            </div>
                          )}

                          {!pending && !lastRejected && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Aún no se ha subido ningún entregable.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  );
                })()}

                {/* Datos del formulario */}
                <div className="space-y-3">
                  <h5 className="font-semibold text-gray-900 dark:text-white">
                    Detalles del Formulario
                  </h5>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                    {Array.isArray(fullTicket?.formFields) && fullTicket.formFields.length > 0 ? (
                      fullTicket.formFields
                        .filter((field: any) => {
                          const value = fullTicket?.formData?.[field.id];
                          const fieldTypeName = field.fieldType?.name?.toUpperCase() || field.fieldType?.type?.toUpperCase();
                          
                          // Excluir campos de sección
                          if (fieldTypeName === 'SECTION_TITLE' || fieldTypeName === 'SECTION_DIVIDER') {
                            return false;
                          }
                          
                          // Solo mostrar campos con valores no vacíos
                          if (value === undefined || value === null || value === '') {
                            return false;
                          }
                          
                          // Para arrays, verificar que no estén vacíos
                          if (Array.isArray(value) && value.length === 0) {
                            return false;
                          }
                          
                          return true;
                        })
                        .map((field: any) => {
                        const value = fullTicket?.formData?.[field.id];
                        
                        // Función para renderizar el valor según su tipo
                        const renderFieldValue = () => {
                          const fieldTypeName = field.fieldType?.name?.toUpperCase() || field.fieldType?.type?.toUpperCase();
                          
                          // Si es un campo de archivo (FILE, IMAGE, MULTIFILE)
                          if (['FILE', 'IMAGE', 'MULTIFILE'].includes(fieldTypeName) && value) {
                            // Si es un array de archivos
                            if (Array.isArray(value) && value.length > 0 && value[0]?.filename) {
                              const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
                              return (
                                <div className="space-y-2">
                                  {value.map((file: any, index: number) => {
                                    // Decodificar HTML entities del file.path
                                    const decodedPath = file.path
                                      .replace(/&#x2F;/g, '/')
                                      .replace(/&amp;/g, '&')
                                      .replace(/&lt;/g, '<')
                                      .replace(/&gt;/g, '>')
                                      .replace(/&quot;/g, '"');
                                    
                                    // Construir URL completa
                                    const fileUrl = `${API_BASE_URL}/${decodedPath}`;
                                    
                                    return (
                                      <button
                                        key={index}
                                        onClick={() => window.open(fileUrl, '_blank')}
                                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer"
                                      >
                                        <span>📎</span>
                                        <span className="underline">{file.originalName || file.filename}</span>
                                        <span className="text-xs text-gray-500">
                                          ({(file.size / 1024).toFixed(1)} KB)
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              );
                            }
                            // Fallback para formato antiguo (string URL)
                            if (typeof value === 'string') {
                              return (
                                <a
                                  href={value}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  Ver archivo adjunto
                                </a>
                              );
                            }
                          }
                          
                          // Si es un array normal (MULTISELECT, CHECKBOX)
                          if (Array.isArray(value)) {
                            return <span>{value.join(', ')}</span>;
                          }
                          
                          // Si es booleano (TOGGLE, CHECKBOX)
                          if (typeof value === 'boolean') {
                            return <span>{value ? 'Sí' : 'No'}</span>;
                          }
                          
                          // Si es SELECT o RADIO
                          if (['SELECT', 'RADIO'].includes(fieldTypeName)) {
                            const option = field.options?.find((opt: any) => opt.value === value);
                            return <span>{option?.label || value || '-'}</span>;
                          }
                          
                          // Si es un objeto (no manejado arriba)
                          if (typeof value === 'object' && value !== null) {
                            return <pre className="text-xs">{JSON.stringify(value, null, 2)}</pre>;
                          }
                          
                          // Valor simple - decodificar entidades HTML
                          const decodedValue = typeof value === 'string'
                            ? value
                                .replace(/&#x2F;/g, '/')
                                .replace(/&amp;/g, '&')
                                .replace(/&lt;/g, '<')
                                .replace(/&gt;/g, '>')
                                .replace(/&quot;/g, '"')
                                .replace(/&#x27;/g, "'")
                                .replace(/&#x3A;/g, ':')
                            : value;
                          return <span className="whitespace-pre-wrap">{decodedValue || '-'}</span>;
                        };

                        return (
                          <div key={field.id} className="border-b border-gray-200 dark:border-gray-600 pb-3 last:border-0 last:pb-0">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              {field.label || field.name || field.title || field.id}
                              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                            </p>
                            <div className="text-gray-900 dark:text-white">
                              {renderFieldValue()}
                            </div>
                          </div>
                        );
                      })
                    ) : fullTicket?.formData && Object.keys(fullTicket.formData).length > 0 ? (
                      Object.entries(fullTicket.formData).map(([fieldId, value]: [string, any]) => {
                        const fieldLabel = fullTicket.fieldLabels?.[fieldId] || fieldId;
                        
                        // Función para renderizar el valor según su tipo
                        const renderValue = () => {
                          // Si es un array de archivos
                          if (Array.isArray(value) && value.length > 0 && value[0]?.filename) {
                            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
                            return (
                              <div className="space-y-2">
                                {value.map((file: any, index: number) => {
                                  // Decodificar HTML entities del file.path
                                  const decodedPath = file.path
                                    .replace(/&#x2F;/g, '/')
                                    .replace(/&amp;/g, '&')
                                    .replace(/&lt;/g, '<')
                                    .replace(/&gt;/g, '>')
                                    .replace(/&quot;/g, '"');
                                  
                                  // Construir URL completa
                                  const fileUrl = `${API_BASE_URL}/${decodedPath}`;
                                  
                                  return (
                                    <button
                                      key={index}
                                      onClick={() => window.open(fileUrl, '_blank')}
                                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer"
                                    >
                                      <span>📎</span>
                                      <span className="underline">{file.originalName || file.filename}</span>
                                      <span className="text-xs text-gray-500">
                                        ({(file.size / 1024).toFixed(1)} KB)
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          }
                          
                          // Si es un array normal
                          if (Array.isArray(value)) {
                            return value.join(', ');
                          }
                          
                          // Si es un objeto (pero no archivo)
                          if (typeof value === 'object' && value !== null) {
                            return JSON.stringify(value, null, 2);
                          }
                          
                          // Si es booleano
                          if (typeof value === 'boolean') {
                            return value ? 'Sí' : 'No';
                          }
                          
                          // Valor simple
                          return String(value);
                        };
                        
                        return (
                          <div key={fieldId} className="border-b border-gray-200 dark:border-gray-600 pb-3 last:border-0 last:pb-0">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              {fieldLabel}
                            </p>
                            <div className="text-gray-900 dark:text-white">
                              {renderValue()}
                            </div>
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

                {/* Tab: Chat */}
                {activeTab === 'chat' && (
                  <div className="h-[60vh]">
                    <ChatWindow 
                      ticketId={ticket.id}
                      ticketStatus={ticket.status}
                    />
                  </div>
                )}

                {/* Tab: Archivos */}
                {activeTab === 'files' && (
                  <div className="h-[500px]">
                    <FileHistory ticketId={ticket.id} />
                  </div>
                )}
              </>
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
