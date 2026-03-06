import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { useAuth } from '../hooks/useAuth';
import { usePageTitle } from '../hooks/usePageTitle';
import { usePermissions } from '../hooks/usePermissions';
import { RoleType } from '../types/permissions';
import kanbanService, { KanbanColumn as KanbanColumnType, KanbanTicket, KanbanFilters } from '../services/kanban.service';
import { ticketsService } from '../services/tickets.service';
import { usersService } from '../services/users.service';
import permissionsService from '../services/permissions.service';
import KanbanColumn from '../components/Kanban/KanbanColumn';
import TicketCard from '../components/Kanban/TicketCard';
import TicketDetailModal from '../components/Kanban/TicketDetailModal';
import DeliverableUpload, { DeliverableUploadHandle } from '../components/Deliverables/DeliverableUpload';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import ModalButtons from '../components/common/ModalButtons';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { FiFilter, FiRefreshCw, FiUpload } from 'react-icons/fi';

export default function KanbanBoardPage() {
  usePageTitle('Kanban');
  const { user } = useAuth();
  const { hasRole } = usePermissions();
  const [columns, setColumns] = useState<KanbanColumnType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState<KanbanTicket | null>(null);
  const [myAdminDepartments, setMyAdminDepartments] = useState<any[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  
  // Modal de detalle
  const [selectedTicket, setSelectedTicket] = useState<KanbanTicket | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Filtros
  const [filters, setFilters] = useState<KanbanFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  // Modal de entregable
  const [showDeliverableModal, setShowDeliverableModal] = useState(false);
  const [pendingResolveTicketId, setPendingResolveTicketId] = useState<string>('');
  const [hasDeliverableFile, setHasDeliverableFile] = useState(false);
  const [isUploadingDeliverable, setIsUploadingDeliverable] = useState(false);
  const deliverableUploadRef = useRef<DeliverableUploadHandle>(null);

  // Modal de motivo de espera
  const [showWaitingReasonModal, setShowWaitingReasonModal] = useState(false);
  const [pendingWaitingTicketId, setPendingWaitingTicketId] = useState<string>('');
  const [waitingReason, setWaitingReason] = useState('');
  const [waitingReasonLoading, setWaitingReasonLoading] = useState(false);

  const isDeptAdmin = hasRole(RoleType.DEPT_ADMIN);
  const isSubordinate = hasRole(RoleType.SUBORDINATE);

  // Configurar sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  );

  useEffect(() => {
    if (user) {
      loadMyAdminDepartments();
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedDepartmentId) {
      loadKanbanBoard();
    }
  }, [selectedDepartmentId, filters]);

  const loadMyAdminDepartments = async () => {
    try {
      const depts = isDeptAdmin
        ? await usersService.getMyAdminDepartments()
        : await permissionsService.getMyDepartments();

      setMyAdminDepartments(depts || []);

      if (depts && depts.length > 0 && !selectedDepartmentId) {
        setSelectedDepartmentId('all');
      }

      if (!depts || depts.length === 0) {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading admin departments:', error);
      toast.error('Error al cargar departamentos');
      setLoading(false);
    }
  };

  const loadKanbanBoard = async () => {
    try {
      setLoading(true);
      
      if (!selectedDepartmentId) {
        setColumns([]);
        setLoading(false);
        return;
      }

      // Si es subordinado, aplicar filtro "solo míos" automáticamente
      const appliedFilters = isSubordinate
        ? { ...filters, onlyMine: true }
        : filters;

      const data = selectedDepartmentId === 'all'
        ? await kanbanService.getAllDepartmentsKanban(appliedFilters)
        : await kanbanService.getDepartmentKanban(
            selectedDepartmentId,
            appliedFilters
          );
      
      setColumns(data);
    } catch (error: any) {
      console.error('Error loading kanban board:', error);
      toast.error('Error al cargar el tablero Kanban');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    
    // Encontrar el ticket que se está arrastrando
    for (const column of columns) {
      const ticket = column.tickets.find(t => t.id === active.id);
      if (ticket) {
        setActiveTicket(ticket);
        break;
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTicket(null);

    if (!over) return;

    const ticketId = active.id as string;
    const newStatus = over.id as string;

    // Encontrar el ticket y su estado actual
    let currentStatus = '';
    let ticket: KanbanTicket | undefined;
    
    for (const column of columns) {
      ticket = column.tickets.find(t => t.id === ticketId);
      if (ticket) {
        currentStatus = column.status;
        break;
      }
    }

    if (!ticket || currentStatus === newStatus) return;

    // Si se arrastra a RESOLVED, verificar si el departamento requiere entregable
    if (newStatus === 'RESOLVED' && ticket.department?.requireDeliverable) {
      setPendingResolveTicketId(ticketId);
      setShowDeliverableModal(true);
      return;
    }

    // Si se arrastra a WAITING, pedir motivo
    if (newStatus === 'WAITING') {
      setPendingWaitingTicketId(ticketId);
      setWaitingReason('');
      setShowWaitingReasonModal(true);
      return;
    }

    try {
      // Actualizar el estado del ticket en el backend
      await ticketsService.updateTicket(ticketId, {
        status: newStatus as any
      });

      toast.success('Ticket actualizado exitosamente');
      
      // Recargar el tablero
      await loadKanbanBoard();
    } catch (error: any) {
      console.error('Error updating ticket status:', error);
      // Mostrar el mensaje de error específico del backend
      const errorMessage = error.response?.data?.error || error.message || 'Error al actualizar el ticket';
      toast.error(errorMessage);
    }
  };

  const handleDeliverableUploaded = async () => {
    setShowDeliverableModal(false);
    if (pendingResolveTicketId) {
      try {
        await ticketsService.updateTicket(pendingResolveTicketId, {
          status: 'RESOLVED' as any
        });
        toast.success('Entregable subido y ticket marcado como resuelto');
        await loadKanbanBoard();
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || 'Error al resolver el ticket';
        toast.error(errorMessage);
      }
    }
    setPendingResolveTicketId('');
  };

  const handleWaitingReasonConfirm = async () => {
    if (!pendingWaitingTicketId || !waitingReason.trim()) return;

    try {
      setWaitingReasonLoading(true);
      await ticketsService.changeStatus(pendingWaitingTicketId, 'WAITING' as any, waitingReason.trim());
      toast.success('Ticket puesto en espera');
      setShowWaitingReasonModal(false);
      setWaitingReason('');
      setPendingWaitingTicketId('');
      await loadKanbanBoard();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Error al cambiar el estado';
      toast.error(errorMessage);
    } finally {
      setWaitingReasonLoading(false);
    }
  };

  const handleTicketClick = (ticketId: string) => {
    // Buscar el ticket en las columnas
    for (const column of columns) {
      const ticket = column.tickets.find(t => t.id === ticketId);
      if (ticket) {
        setSelectedTicket(ticket);
        setShowDetailModal(true);
        break;
      }
    }
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedTicket(null);
  };

  const handleTicketUpdate = async () => {
    await loadKanbanBoard();
  };

  const handleFilterChange = (key: keyof KanbanFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  if (!user) {
    return <LoadingSpinner />;
  }

  // Solo DEPT_ADMIN, SUBORDINATE y REQUESTER pueden ver el Kanban
  if (!isDeptAdmin && !isSubordinate) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Acceso Denegado
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            No tienes permisos para ver el tablero Kanban
          </p>
        </div>
      </div>
    );
  }

  if (myAdminDepartments.length === 0 && !loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Sin Departamentos
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            No estás asignado a ningún departamento
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tablero Kanban"
        description="Gestiona tickets con drag & drop"
        action={
          <button
            onClick={loadKanbanBoard}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transition-all duration-200"
          >
            <FiRefreshCw />
            <span>Actualizar</span>
          </button>
        }
      />

      {/* Selector de Departamento y Filtros */}
      <Card>
        <div className="space-y-4">
          {/* Selector de Departamento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Departamento
            </label>
            <select
              value={selectedDepartmentId}
              onChange={(e) => setSelectedDepartmentId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos los departamentos</option>
              {myAdminDepartments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Botón de Filtros */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <FiFilter />
              <span>Filtros</span>
              {(filters.priority || filters.onlyMine) && (
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              )}
            </button>

            {(filters.priority || (filters.onlyMine && !isSubordinate)) && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {/* Panel de Filtros */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              {/* Filtro de Prioridad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prioridad
                </label>
                <select
                  value={filters.priority || ''}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Todas</option>
                  <option value="LOW">Baja</option>
                  <option value="MEDIUM">Media</option>
                  <option value="HIGH">Alta</option>
                  <option value="CRITICAL">Crítica</option>
                </select>
              </div>

              {/* Filtro Solo Mis Tickets (checkbox para DEPT_ADMIN y SUPER_ADMIN) */}
              {!isSubordinate && (
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.onlyMine || false}
                      onChange={(e) => handleFilterChange('onlyMine', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Solo mis tickets
                    </span>
                  </label>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Tablero Kanban */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 w-full">
            {columns.map((column) => (
              <div key={column.status} className="flex-1 min-w-0">
                <KanbanColumn 
                  column={column}
                  onTicketClick={handleTicketClick}
                />
              </div>
            ))}
          </div>

          {/* Overlay para mostrar el ticket mientras se arrastra */}
          <DragOverlay>
            {activeTicket && <TicketCard ticket={activeTicket} isDragging />}
          </DragOverlay>
        </DndContext>
      )}

      {/* Mensaje si no hay tickets */}
      {!loading && columns.every(col => col.tickets.length === 0) && (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No hay tickets en este departamento
            </p>
          </div>
        </Card>
      )}

      {/* Modal de detalle de ticket */}
      {showDetailModal && selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={handleCloseModal}
          onUpdate={handleTicketUpdate}
          canEdit={isDeptAdmin}
        />
      )}

      {/* Modal de subir entregable */}
      <Modal
        isOpen={showDeliverableModal}
        onClose={() => {
          setShowDeliverableModal(false);
          setPendingResolveTicketId('');
        }}
        title="Subir Entregable"
        subtitle="Este departamento requiere que subas un entregable antes de resolver el ticket"
        size="md"
        footer={
          <ModalButtons
            onCancel={() => {
              setShowDeliverableModal(false);
              setPendingResolveTicketId('');
              setHasDeliverableFile(false);
            }}
            onConfirm={() => deliverableUploadRef.current?.upload()}
            cancelText="Cancelar"
            confirmText="Subir Entregable"
            confirmIcon={<FiUpload className="w-4 h-4" />}
            loading={isUploadingDeliverable}
            confirmDisabled={!hasDeliverableFile}
            variant="primary"
          />
        }
      >
        {pendingResolveTicketId && (
          <DeliverableUpload
            ref={deliverableUploadRef}
            ticketId={pendingResolveTicketId}
            onUploadSuccess={handleDeliverableUploaded}
            onFileChange={setHasDeliverableFile}
            onUploadingChange={setIsUploadingDeliverable}
            hideButtons
          />
        )}
      </Modal>

      {/* Modal de motivo de espera */}
      <Modal
        isOpen={showWaitingReasonModal}
        onClose={() => {
          setShowWaitingReasonModal(false);
          setPendingWaitingTicketId('');
          setWaitingReason('');
        }}
        title="Motivo de Espera"
        subtitle="Indica el motivo por el cual el ticket pasa a espera"
        size="md"
        footer={
          <ModalButtons
            onCancel={() => {
              setShowWaitingReasonModal(false);
              setPendingWaitingTicketId('');
              setWaitingReason('');
            }}
            onConfirm={handleWaitingReasonConfirm}
            cancelText="Cancelar"
            confirmText="Confirmar"
            loading={waitingReasonLoading}
            confirmDisabled={!waitingReason.trim()}
          />
        }
      >
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
      </Modal>
    </div>
  );
}
