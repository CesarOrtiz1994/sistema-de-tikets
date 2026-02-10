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
import CloseTicketModal from '../components/Tickets/CloseTicketModal';
import ReopenTicketModal from '../components/Tickets/ReopenTicketModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import StarRating from '../components/common/StarRating';
import ChatWindow from '../components/Chat/ChatWindow';
import FileHistory from '../components/Chat/FileHistory';
import TicketRelationship from '../components/Tickets/TicketRelationship';
import { FiArrowLeft, FiClock, FiCalendar, FiCheckCircle, FiAlertCircle, FiBriefcase, FiFileText, FiXCircle, FiUserCheck, FiEdit, FiRotateCcw, FiRefreshCw, FiMessageSquare, FiFolder, FiPackage, FiDownload, FiAlertTriangle } from 'react-icons/fi';
import { deliverablesService } from '../services/deliverables.service';
import { Deliverable, DeliverableStatus } from '../types/deliverable';
import { ticketsService, Ticket, TicketStatus, TicketPriority } from '../services/tickets.service';
import { departmentsService } from '../services/departments.service';
import { BadgeVariant } from '../components/common/Badge';
import { formatDate } from '../utils/dateUtils';
import { getHistoryMessage, getHistoryIcon } from '../utils/historyUtils';
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
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);

  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus>('NEW');
  const [selectedPriority, setSelectedPriority] = useState<TicketPriority>('MEDIUM');
  const [waitingReason, setWaitingReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'files' | 'deliverables'>('chat');

  // Entregables
  const [pendingDeliverable, setPendingDeliverable] = useState<Deliverable | null>(null);
  const [showRejectDeliverableModal, setShowRejectDeliverableModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [deliverableProcessing, setDeliverableProcessing] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [deliverableApproved, setDeliverableApproved] = useState(false);

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

  useEffect(() => {
    if (ticket?.department?.requireDeliverable && id) {
      loadPendingDeliverable();
    }
  }, [ticket?.id, ticket?.department?.requireDeliverable]);

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

  const loadPendingDeliverable = async () => {
    try {
      const deliverables = await deliverablesService.getTicketDeliverables(id!);
      const pending = deliverables.find(d => d.status === DeliverableStatus.PENDING);
      setPendingDeliverable(pending || null);
      const approved = deliverables.some(d => d.status === DeliverableStatus.APPROVED);
      setDeliverableApproved(approved);
    } catch (error) {
      console.error('Error loading deliverables:', error);
    }
  };

  const handleApproveDeliverable = async () => {
    if (!pendingDeliverable) return;

    setDeliverableProcessing(true);
    try {
      await deliverablesService.approveDeliverable(pendingDeliverable.id);
      toast.success('Entregable aprobado exitosamente');
      setPendingDeliverable(null);
      setDeliverableApproved(true);
      loadTicket();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al aprobar el entregable');
    } finally {
      setDeliverableProcessing(false);
    }
  };

  const handleRejectDeliverable = async () => {
    if (!pendingDeliverable || !rejectionReason.trim()) {
      toast.error('Debes proporcionar una razón para el rechazo');
      return;
    }

    setDeliverableProcessing(true);
    try {
      const result = await deliverablesService.rejectDeliverable(
        pendingDeliverable.id,
        rejectionReason
      );

      if (result.exceededLimit) {
        toast.success(
          `Entregable rechazado. Se excedió el límite de rechazos. Ticket cerrado y nuevo creado: ${result.followUpTicket?.ticketNumber}`,
          { duration: 8000 }
        );
      } else {
        toast.success(
          `Entregable rechazado. Rechazos: ${result.rejectionCount}/${result.maxRejections}`,
          { duration: 5000 }
        );
      }

      setShowRejectDeliverableModal(false);
      setRejectionReason('');
      setPendingDeliverable(null);
      loadTicket();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al rechazar el entregable');
    } finally {
      setDeliverableProcessing(false);
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

    if (selectedStatus === 'WAITING' && !waitingReason.trim()) {
      toast.error('Debes indicar el motivo de espera');
      return;
    }

    try {
      setActionLoading(true);
      const reason = selectedStatus === 'WAITING' ? waitingReason.trim() : undefined;
      await ticketsService.changeStatus(ticket.id, selectedStatus, reason);
      toast.success('Estado actualizado exitosamente');
      setShowStatusModal(false);
      setWaitingReason('');
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

  const handleCloseTicket = async (rating?: number, comment?: string) => {
    if (!ticket) return;

    try {
      await ticketsService.closeTicket(ticket.id, rating, comment);
      toast.success('Ticket cerrado exitosamente');
      loadTicket();
    } catch (error: any) {
      console.error('Error closing ticket:', error);
      toast.error(error.response?.data?.message || 'Error al cerrar el ticket');
      throw error;
    }
  };

  const handleReopenTicket = async (reason: string) => {
    if (!ticket) return;

    try {
      await ticketsService.reopenTicket(ticket.id, reason);
      toast.success('Ticket reabierto exitosamente');
      loadTicket();
    } catch (error: any) {
      console.error('Error reopening ticket:', error);
      toast.error(error.response?.data?.message || 'Error al reabrir el ticket');
      throw error;
    }
  };

  const canAssign = userRole === RoleType.DEPT_ADMIN || userRole === RoleType.SUPER_ADMIN;
  const canChangeStatus = ticket?.assignedToId === user?.id || canAssign;
  const canChangePriority = canAssign;
  const canCancel = ticket?.requesterId === user?.id && ticket?.status === 'NEW';
  const canCloseTicket = ticket?.requesterId === user?.id && ticket?.status === 'RESOLVED';
  const canReopenTicket = ticket?.requesterId === user?.id && ticket?.status === 'CLOSED';

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
        action={
         <div className="flex flex-wrap gap-2">
            <button
              onClick={loadTicket}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:shadow-lg transition-all duration-200"
            >
              <FiRefreshCw />
              <span>Actualizar</span>
            </button>
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
            {canCloseTicket && (
              <button
                onClick={() => setShowCloseModal(true)}
                disabled={ticket?.department?.requireDeliverable && !deliverableApproved}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title={ticket?.department?.requireDeliverable && !deliverableApproved ? 'Debes aprobar el entregable antes de cerrar el ticket' : undefined}
              >
                <FiCheckCircle />
                <span>{ticket?.department?.requireRating ? 'Cerrar y Calificar' : 'Cerrar Ticket'}</span>
              </button>
            )}
            {canReopenTicket && (
              <button
                onClick={() => setShowReopenModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
              >
                <FiRotateCcw />
                <span>Reabrir Ticket</span>
              </button>
            )}
          </div> 
        }
        other={
          <>
          {getStatusBadge(ticket.status)}
          {getPriorityBadge(ticket.priority)}
            {ticket.slaExceeded && (
              <Badge variant="danger" size="md">
                <FiAlertCircle className="inline mr-1" />
                SLA Excedido
              </Badge>
            )}
          </>
        }
      />

      {/* Banner Motivo de Espera */}
      {ticket.status === 'WAITING' && ticket.waitingReason && (
        <Card padding="md" className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
          <div className="flex items-start gap-3">
            <FiClock className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">
                Ticket en espera
              </p>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                {ticket.waitingReason}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Entregable */}
      {ticket.department?.requireDeliverable && !['CLOSED', 'CANCELLED'].includes(ticket.status) && (
        <Card>
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FiPackage />
              Entregable
            </h3>
            {deliverableApproved ? (
              <Badge variant="success" size="sm">Aprobado</Badge>
            ) : pendingDeliverable ? (
              <Badge variant="warning" size="sm">Pendiente de Revisión</Badge>
            ) : (
              <Badge variant="gray" size="sm">Sin entregable</Badge>
            )}
          </div>

          {deliverableApproved ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <p className="text-sm text-green-700 dark:text-green-300">
                {ticket.department?.requireRating
                  ? 'El entregable fue aprobado. Por favor cierra y califica el ticket.'
                  : 'El entregable fue aprobado. Por favor cierra el ticket.'}
              </p>
            </div>
          ) : (
            <>
              {/* Info de rechazos */}
              {ticket.deliverableRejections > 0 && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Rechazos realizados</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {ticket.deliverableRejections} <span className="text-sm font-normal text-gray-500">/ {ticket.department?.maxDeliverableRejections ?? 3}</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Intentos restantes</div>
                    <div className={`text-lg font-bold ${((ticket.department?.maxDeliverableRejections ?? 3) - ticket.deliverableRejections) <= 1 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                      {(ticket.department?.maxDeliverableRejections ?? 3) - ticket.deliverableRejections}
                    </div>
                  </div>
                </div>
              )}

              {pendingDeliverable && (user?.id === ticket.requesterId || userRole === RoleType.SUPER_ADMIN) ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    El agente ha subido un archivo entregable. Revísalo y decide si lo apruebas o rechazas.
                  </p>

                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="p-2 rounded-lg bg-white dark:bg-gray-800">
                      <FiFolder className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {pendingDeliverable.fileName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Subido por {pendingDeliverable.uploadedBy.name} • {new Date(pendingDeliverable.createdAt).toLocaleDateString('es-MX')}
                      </p>
                    </div>
                    <a
                      href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${pendingDeliverable.fileUrl}`}
                      download
                      className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Descargar"
                    >
                      <FiDownload className="w-4 h-4" />
                    </a>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setShowRejectDeliverableModal(true)}
                      disabled={deliverableProcessing}
                      className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                    >
                      <FiXCircle className="w-4 h-4" />
                      Rechazar
                    </button>
                    <button
                      onClick={() => setShowApproveConfirm(true)}
                      disabled={deliverableProcessing}
                      className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                    >
                      <FiCheckCircle className="w-4 h-4" />
                      Aprobar
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Este departamento requiere que el agente suba un archivo entregable antes de resolver el ticket.
                  {!pendingDeliverable && ' Aún no se ha subido ningún entregable.'}
                </p>
              )}
            </>
          )}
        </Card>
      )}

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

          {/* Calificación del Ticket (si existe) */}
          {(ticket as any).rating && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Calificación del Servicio
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Calificación
                  </label>
                  <StarRating
                    rating={(ticket as any).rating.rating}
                    readonly={true}
                    size="lg"
                    showLabel={true}
                  />
                </div>
                
                {(ticket as any).rating.comment && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Comentario
                    </label>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {(ticket as any).rating.comment}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Fecha de Calificación
                  </label>
                  <div className="flex items-center gap-2">
                    <FiCalendar className="text-gray-500" />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {formatDate((ticket as any).rating.ratedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}

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
                                  <FiFileText />
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
                            className="text-blue-600 hover:underline flex items-center gap-2"
                          >
                            <FiFileText />
                            Ver archivo adjunto
                          </a>
                        );
                      }
                    }
                    
                    // Si es un array normal (MULTISELECT, CHECKBOX)
                    if (Array.isArray(value)) {
                      return <span>{value.join(', ')}</span>;
                    }
                    
                    // Si es booleano (TOGGLE)
                    if (typeof value === 'boolean') {
                      return <span>{value ? 'Sí' : 'No'}</span>;
                    }
                    
                    // Si es SELECT o RADIO
                    if (['SELECT', 'RADIO'].includes(fieldTypeName)) {
                      const option = field.options?.find((opt: any) => opt.value === value);
                      return <span>{option?.label || value || '-'}</span>;
                    }
                    
                    // Valor simple
                    return <span className="whitespace-pre-wrap">{value || '-'}</span>;
                  };
                  
                  return (
                    <div key={field.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        {field.label}
                        {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {renderFieldValue()}
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
        <div className="lg:col-span-1 space-y-6">
          {/* Vinculación de Tickets */}
          <TicketRelationship
            parentTicket={ticket.parentTicket}
            childTickets={ticket.childTickets}
          />

          {/* Historial de Cambios */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Historial de Cambios
            </h3>
            <div className="space-y-4">
              {ticket.history && ticket.history.length > 0 ? (
                <div className="relative max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                  {ticket.history.map((entry: any) => {
                    const message = getHistoryMessage(entry.action, entry.details);
                    const icon = getHistoryIcon(entry.action);
                    
                    return (
                      <div key={entry.id} className="relative pl-10 pb-6 last:pb-0">
                        <div className="absolute left-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                          {entry.user?.name?.charAt(0).toUpperCase() || icon}
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                          <div className="flex items-start justify-between mb-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {entry.user?.name || 'Sistema'}
                            </p>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(entry.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-base">{icon}</span>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {message}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  No hay historial de cambios
                </p>
              )}
            </div>
          </Card>

          {/* Chat, Archivos y Entregables con Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Tabs Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-3">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    activeTab === 'chat'
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <FiMessageSquare className="w-4 h-4" />
                  Chat en Tiempo Real
                  {activeTab === 'chat' && <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>}
                </button>
                <button
                  onClick={() => setActiveTab('files')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    activeTab === 'files'
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <FiFolder className="w-4 h-4" />
                  Archivos Adjuntos
                </button>
              </div>
            </div>
            
            {/* Contenido de los Tabs */}
            <div className="h-[500px]">
              {activeTab === 'chat' ? (
                <ChatWindow 
                  ticketId={ticket.id}
                  ticketStatus={ticket.status}
                  assignedToId={ticket.assignedToId}
                />
              ) : (
                <FileHistory ticketId={ticket.id} />
              )}
            </div>
          </div>
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
        onClose={() => { setShowStatusModal(false); setWaitingReason(''); }}
        title="Cambiar Estado"
        subtitle="Selecciona el nuevo estado del ticket"
        footer={
          <ModalButtons
            onCancel={() => { setShowStatusModal(false); setWaitingReason(''); }}
            onConfirm={handleChangeStatus}
            confirmText="Cambiar"
            confirmIcon={<FiEdit />}
            loading={actionLoading}
            confirmDisabled={selectedStatus === 'WAITING' && !waitingReason.trim()}
          />
        }
      >
        <div className="space-y-4">
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

          {selectedStatus === 'WAITING' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Motivo de espera <span className="text-red-500">*</span>
              </label>
              <textarea
                value={waitingReason}
                onChange={(e) => setWaitingReason(e.target.value)}
                placeholder="Indica el motivo por el cual el ticket pasa a espera..."
                rows={3}
                maxLength={500}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                {waitingReason.length}/500
              </p>
            </div>
          )}
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

      {/* Modal Cerrar Ticket */}
      <CloseTicketModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onConfirm={handleCloseTicket}
        requireRating={ticket?.department?.requireRating ?? false}
        ticketNumber={ticket?.ticketNumber || ''}
      />

      {/* Modal Reabrir Ticket */}
      <ReopenTicketModal
        isOpen={showReopenModal}
        onClose={() => setShowReopenModal(false)}
        onConfirm={handleReopenTicket}
        ticketNumber={ticket?.ticketNumber || ''}
      />

      {/* Modal Rechazar Entregable */}
      <Modal
        isOpen={showRejectDeliverableModal}
        onClose={() => {
          setShowRejectDeliverableModal(false);
          setRejectionReason('');
        }}
        title="Rechazar Entregable"
        subtitle="Proporciona una razón para que el agente pueda corregir el problema"
        size="md"
        footer={
          <ModalButtons
            onCancel={() => {
              setShowRejectDeliverableModal(false);
              setRejectionReason('');
            }}
            onConfirm={handleRejectDeliverable}
            cancelText="Cancelar"
            confirmText="Confirmar Rechazo"
            confirmIcon={<FiXCircle />}
            loading={deliverableProcessing}
            confirmDisabled={!rejectionReason.trim()}
            variant="danger"
          />
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <FiAlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-200">
              Al rechazar el entregable, el ticket regresará a En Progreso para que el agente pueda corregirlo.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Razón del rechazo *
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Describe qué debe corregirse..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
              rows={4}
              disabled={deliverableProcessing}
            />
          </div>
        </div>
      </Modal>

      {/* Confirmar Aprobación de Entregable */}
      <ConfirmDialog
        isOpen={showApproveConfirm}
        title="Aprobar Entregable"
        message="¿Estás seguro de que deseas aprobar este entregable? Una vez aprobado, el ticket podrá ser cerrado."
        confirmText="Aprobar"
        cancelText="Cancelar"
        type="info"
        onConfirm={() => {
          setShowApproveConfirm(false);
          handleApproveDeliverable();
        }}
        onCancel={() => setShowApproveConfirm(false)}
      />
    </div>
  );
}
