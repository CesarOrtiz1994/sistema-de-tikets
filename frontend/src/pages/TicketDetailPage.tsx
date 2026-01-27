import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import WorkScheduleInfo from '../components/Tickets/WorkScheduleInfo';
import Modal from '../components/common/Modal';
import ModalButtons from '../components/common/ModalButtons';
import { FiArrowLeft, FiClock, FiCalendar, FiCheckCircle, FiAlertCircle, FiBriefcase, FiFileText, FiXCircle, FiUserCheck, FiEdit} from 'react-icons/fi';
import { ticketsService, Ticket, TicketStatus, TicketPriority } from '../services/tickets.service';
import { departmentsService } from '../services/departments.service';
import { BadgeVariant } from '../components/common/Badge';
import { formatDate } from '../utils/dateUtils';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { RoleType } from '../types/permissions';

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: 'NEW', label: 'Nuevo' },
  { value: 'ASSIGNED', label: 'Asignado' },
  { value: 'IN_PROGRESS', label: 'En Progreso' },
  { value: 'WAITING', label: 'En Espera' },
  { value: 'RESOLVED', label: 'Resuelto' },
  { value: 'CLOSED', label: 'Cerrado' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: 'LOW', label: 'Baja' },
  { value: 'MEDIUM', label: 'Media' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'CRITICAL', label: 'Crítica' },
];

const getStatusBadge = (status: TicketStatus) => {
  const variants: Record<TicketStatus, BadgeVariant> = {
    NEW: 'info',
    ASSIGNED: 'gray',
    IN_PROGRESS: 'warning',
    WAITING: 'orange',
    RESOLVED: 'success',
    CLOSED: 'gray',
    CANCELLED: 'danger',
  };
  
  const labels: Record<TicketStatus, string> = {
    NEW: 'Nuevo',
    ASSIGNED: 'Asignado',
    IN_PROGRESS: 'En Progreso',
    WAITING: 'En Espera',
    RESOLVED: 'Resuelto',
    CLOSED: 'Cerrado',
    CANCELLED: 'Cancelado',
  };

  return <Badge variant={variants[status]} size="md">{labels[status]}</Badge>;
};

const getPriorityBadge = (priority: TicketPriority) => {
  const variants: Record<TicketPriority, BadgeVariant> = {
    LOW: 'green',
    MEDIUM: 'yellow',
    HIGH: 'orange',
    CRITICAL: 'red',
  };
  
  const labels: Record<TicketPriority, string> = {
    LOW: 'Baja',
    MEDIUM: 'Media',
    HIGH: 'Alta',
    CRITICAL: 'Crítica',
  };

  return <Badge variant={variants[priority]} size="md">{labels[priority]}</Badge>;
};

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userRole } = usePermissions();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [departmentUsers, setDepartmentUsers] = useState<any[]>([]);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);

  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus>('NEW');
  const [selectedPriority, setSelectedPriority] = useState<TicketPriority>('MEDIUM');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadTicket();
    }
  }, [id]);

  useEffect(() => {
    if (ticket?.departmentId) {
      loadDepartmentUsers(ticket.departmentId);
    }
  }, [ticket?.departmentId]);

  const loadTicket = async () => {
    try {
      setLoading(true);
      const data = await ticketsService.getTicketById(id!);
      setTicket(data);
    } catch (error) {
      console.error('Error loading ticket:', error);
      toast.error('Error al cargar el ticket');
      navigate('/tickets');
    } finally {
      setLoading(false);
    }
  };

  const loadDepartmentUsers = async (departmentId: string) => {
    try {
      const response = await departmentsService.getDepartmentUsers(departmentId);
      // Backend devuelve { success: true, data: [...] } donde data es array de departmentUser con user nested
      const users = response.data?.map((du: any) => du.user) || [];
      setDepartmentUsers(users);
    } catch (error) {
      console.error('Error loading department users:', error);
      setDepartmentUsers([]);
    }
  };

  const handleAssign = async () => {
    if (!selectedAssignee || !ticket) return;

    try {
      setActionLoading(true);
      await ticketsService.assignTicket(ticket.id, selectedAssignee);
      toast.success('Ticket asignado exitosamente');
      setShowAssignModal(false);
      loadTicket();
    } catch (error) {
      console.error('Error assigning ticket:', error);
      toast.error('Error al asignar el ticket');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeStatus = async () => {
    if (!ticket) return;

    try {
      setActionLoading(true);
      await ticketsService.changeStatus(ticket.id, selectedStatus);
      toast.success('Estado actualizado exitosamente');
      setShowStatusModal(false);
      loadTicket();
    } catch (error) {
      console.error('Error changing status:', error);
      toast.error('Error al cambiar el estado');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangePriority = async () => {
    if (!ticket) return;

    try {
      setActionLoading(true);
      await ticketsService.changePriority(ticket.id, selectedPriority);
      toast.success('Prioridad actualizada exitosamente');
      setShowPriorityModal(false);
      loadTicket();
    } catch (error) {
      console.error('Error changing priority:', error);
      toast.error('Error al cambiar la prioridad');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelTicket = async () => {
    if (!ticket) return;

    try {
      setActionLoading(true);
      await ticketsService.changeStatus(ticket.id, 'CANCELLED');
      toast.success('Ticket cancelado exitosamente');
      loadTicket();
    } catch (error) {
      console.error('Error canceling ticket:', error);
      toast.error('Error al cancelar el ticket');
    } finally {
      setActionLoading(false);
    }
  };

  const canAssign = userRole === RoleType.DEPT_ADMIN || userRole === RoleType.SUPER_ADMIN;
  const canChangeStatus = ticket?.assignedToId === user?.id || canAssign;
  const canChangePriority = canAssign;
  const canCancel = ticket?.requesterId === user?.id && ticket?.status === 'NEW';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600 dark:text-gray-400">Ticket no encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
        >
          <FiArrowLeft size={20} />
        </button>
        <span className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
          {ticket.ticketNumber}
        </span>
      </div>
      <PageHeader
        title={ticket.title}
        description={`Ticket #${ticket.ticketNumber}`}
      />

      {/* Header con badges y acciones */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {getStatusBadge(ticket.status)}
            {getPriorityBadge(ticket.priority)}
            {ticket.slaExceeded && (
              <Badge variant="danger" size="md">
                <FiAlertCircle className="inline mr-1" />
                SLA Excedido
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {canAssign && (
              <button
                onClick={() => {
                  setSelectedAssignee(ticket.assignedToId || '');
                  setShowAssignModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
              >
                <FiUserCheck />
                <span>Asignar</span>
              </button>
            )}
            {canChangeStatus && (
              <button
                onClick={() => {
                  setSelectedStatus(ticket.status);
                  setShowStatusModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
              >
                <FiEdit />
                <span>Cambiar Estado</span>
              </button>
            )}
            {canChangePriority && (
              <button
                onClick={() => {
                  setSelectedPriority(ticket.priority);
                  setShowPriorityModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
              >
                <FiAlertCircle />
                <span>Cambiar Prioridad</span>
              </button>
            )}
            {canCancel && (
              <button
                onClick={handleCancelTicket}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50"
              >
                <FiXCircle />
                <span>Cancelar Ticket</span>
              </button>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información del ticket */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiFileText />
              Información del Ticket
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Solicitante
                </label>
                <div className="flex items-center gap-2">
                  {ticket.requester?.profilePicture ? (
                    <img
                      src={ticket.requester.profilePicture}
                      alt={ticket.requester.name}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-white font-semibold">
                      {ticket.requester?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {ticket.requester?.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {ticket.requester?.email}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Departamento
                </label>
                <div className="flex items-center gap-2">
                  <FiBriefcase className="text-gray-400" />
                  <span className="text-sm text-gray-900 dark:text-white">
                    {ticket.department?.name}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Asignado a
                </label>
                {ticket.assignedTo ? (
                  <div className="flex items-center gap-2">
                    {ticket.assignedTo.profilePicture ? (
                      <img
                        src={ticket.assignedTo.profilePicture}
                        alt={ticket.assignedTo.name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-600 to-teal-600 flex items-center justify-center text-white font-semibold">
                        {ticket.assignedTo.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {ticket.assignedTo.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {ticket.assignedTo.email}
                      </p>
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                    Sin asignar
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Fecha de Creación
                </label>
                <div className="flex items-center gap-2">
                  <FiCalendar className="text-gray-400" />
                  <span className="text-sm text-gray-900 dark:text-white">
                    {formatDate(ticket.createdAt)}
                  </span>
                </div>
              </div>

              {ticket.slaDeadline && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    SLA Deadline
                  </label>
                  <div className="flex items-center gap-2">
                    <FiClock className={ticket.slaExceeded ? 'text-red-500' : 'text-gray-400'} />
                    <span className={`text-sm ${ticket.slaExceeded ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-900 dark:text-white'}`}>
                      {formatDate(ticket.slaDeadline)}
                    </span>
                  </div>
                </div>
              )}

              {ticket.createdOutsideBusinessHours && ticket.slaStartTime && (
                <div className="col-span-2">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <FiClock className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                          Ticket creado fuera de horario laboral
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          El SLA comenzó a contar el <strong>{formatDate(ticket.slaStartTime)}</strong> (inicio del siguiente horario laboral)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {ticket.resolvedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Fecha de Resolución
                  </label>
                  <div className="flex items-center gap-2">
                    <FiCheckCircle className="text-green-500" />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {formatDate(ticket.resolvedAt)}
                    </span>
                  </div>
                </div>
              )}

              {ticket.closedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Fecha de Cierre
                  </label>
                  <div className="flex items-center gap-2">
                    <FiCheckCircle className="text-gray-500" />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {formatDate(ticket.closedAt)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Horario de Atención del Departamento */}
          {ticket.department && (
            <WorkScheduleInfo
              departmentId={ticket.department.id}
              departmentName={ticket.department.name}
            />
          )}

          {/* Formulario del ticket */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Detalles del Formulario
            </h3>
            <div className="space-y-4">
              {(ticket.form as any)?.fields && (ticket.form as any).fields.length > 0 ? (
                (ticket.form as any).fields.map((field: any) => {
                  const value = ticket.formData?.[field.id];
                  
                  return (
                    <div key={field.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        {field.label}
                        {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {field.fieldType.type === 'FILE' && value ? (
                          <a
                            href={value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-2"
                          >
                            <FiFileText />
                            Ver archivo adjunto
                          </a>
                        ) : field.fieldType.type === 'CHECKBOX' ? (
                          <span>{value ? 'Sí' : 'No'}</span>
                        ) : field.fieldType.type === 'SELECT' || field.fieldType.type === 'RADIO' ? (
                          <span>{field.options?.find((opt: any) => opt.value === value)?.label || value}</span>
                        ) : (
                          <span className="whitespace-pre-wrap">{value || '-'}</span>
                        )}
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
          </Card>
        </div>

        {/* Columna lateral - Historial */}
        <div className="lg:col-span-1">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Historial de Cambios
            </h3>
            <div className="space-y-4">
              {ticket.history && ticket.history.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                  {ticket.history.map((entry: any) => (
                    <div key={entry.id} className="relative pl-10 pb-6 last:pb-0">
                      <div className="absolute left-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                        {entry.user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <div className="flex items-start justify-between mb-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {entry.user?.name || 'Sistema'}
                          </p>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(entry.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                          {entry.action}
                        </p>
                        {entry.details && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                            {typeof entry.details === 'string' ? entry.details : JSON.stringify(entry.details)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  No hay historial de cambios
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Modal Asignar */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Asignar Ticket"
        subtitle="Selecciona un usuario del departamento"
        footer={
          <ModalButtons
            onCancel={() => setShowAssignModal(false)}
            onConfirm={handleAssign}
            confirmText="Asignar"
            confirmIcon={<FiUserCheck />}
            loading={actionLoading}
            confirmDisabled={!selectedAssignee}
          />
        }
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Usuario
          </label>
          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">Seleccionar usuario</option>
            {departmentUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} - {user.email}
              </option>
            ))}
          </select>
        </div>
      </Modal>

      {/* Modal Cambiar Estado */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Cambiar Estado"
        subtitle="Selecciona el nuevo estado del ticket"
        footer={
          <ModalButtons
            onCancel={() => setShowStatusModal(false)}
            onConfirm={handleChangeStatus}
            confirmText="Cambiar"
            confirmIcon={<FiEdit />}
            loading={actionLoading}
          />
        }
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Estado
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as TicketStatus)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </Modal>

      {/* Modal Cambiar Prioridad */}
      <Modal
        isOpen={showPriorityModal}
        onClose={() => setShowPriorityModal(false)}
        title="Cambiar Prioridad"
        subtitle="Selecciona la nueva prioridad del ticket"
        footer={
          <ModalButtons
            onCancel={() => setShowPriorityModal(false)}
            onConfirm={handleChangePriority}
            confirmText="Cambiar"
            confirmIcon={<FiAlertCircle />}
            loading={actionLoading}
          />
        }
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Prioridad
          </label>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value as TicketPriority)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </Modal>
    </div>
  );
}
