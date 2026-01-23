import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { FiPlus, FiFilter, FiFileText, FiClock, FiCheckCircle } from 'react-icons/fi';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import DataTable from '../components/common/DataTable';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/common/EmptyState';
import SearchInput from '../components/common/SearchInput';
import StatCard from '../components/common/StatCard';
import { ticketsService, Ticket, TicketStatus, TicketPriority } from '../services/tickets.service';
import { BadgeVariant } from '../components/common/Badge';
import { formatDate } from '../utils/dateUtils';

const STATUS_OPTIONS: { value: TicketStatus | ''; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'NEW', label: 'Nuevo' },
  { value: 'ASSIGNED', label: 'Asignado' },
  { value: 'IN_PROGRESS', label: 'En Progreso' },
  { value: 'WAITING', label: 'En Espera' },
  { value: 'RESOLVED', label: 'Resuelto' },
  { value: 'CLOSED', label: 'Cerrado' },
];

const PRIORITY_OPTIONS: { value: TicketPriority | ''; label: string }[] = [
  { value: '', label: 'Todas las prioridades' },
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

  return <Badge variant={variants[status]} size="sm">{labels[status]}</Badge>;
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

  return <Badge variant={variants[priority]} size="sm">{labels[priority]}</Badge>;
};

export default function TicketsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);
  const [stats, setStats] = useState({ pending: 0, resolved: 0 });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | ''>('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadTickets();
    }
  }, [currentPage, statusFilter, priorityFilter, user?.id]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        setLoading(false);
        return;
      }
      
      // SOLO tickets creados por el usuario actual (Mis Tickets)
      // Forzamos requesterId para que TODOS los roles vean solo sus tickets
      const response = await ticketsService.listTickets({
        page: currentPage,
        limit: 10,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        search: searchTerm || undefined,
        requesterId: user.id, // FORZAR: Solo tickets que YO creé
      });

      setTickets(response.data);
      setTotalPages(response.totalPages);
      setTotalTickets(response.total);
      
      // Calcular estadísticas
      const pending = response.data.filter(t => 
        ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'WAITING'].includes(t.status)
      ).length;
      const resolved = response.data.filter(t => 
        ['RESOLVED', 'CLOSED'].includes(t.status)
      ).length;
      setStats({ pending, resolved });
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast.error('Error al cargar los tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadTickets();
  };

  const handleRowClick = (ticket: Ticket) => {
    navigate(`/tickets/${ticket.id}`);
  };

  const columns = [
    {
      key: 'ticketNumber',
      header: 'Número',
      render: (ticket: Ticket) => (
        <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
          {ticket.ticketNumber}
        </span>
      ),
    },
    {
      key: 'title',
      header: 'Título',
      render: (ticket: Ticket) => (
        <div className="max-w-md">
          <p className="font-medium text-gray-900 dark:text-white truncate">
            {ticket.title}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {ticket.department?.name}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (ticket: Ticket) => getStatusBadge(ticket.status),
    },
    {
      key: 'priority',
      header: 'Prioridad',
      render: (ticket: Ticket) => getPriorityBadge(ticket.priority),
    },
    {
      key: 'assignedTo',
      header: 'Asignado a',
      render: (ticket: Ticket) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {ticket.assignedTo?.name || 'Sin asignar'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Fecha de Creación',
      render: (ticket: Ticket) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {formatDate(ticket.createdAt)}
        </span>
      ),
    },
  ];

  if (loading && tickets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis Tickets"
        description="Visualiza y gestiona tus solicitudes"
        action={
          <button
            onClick={() => navigate('/tickets/create')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-200"
          >
            <FiPlus />
            <span>Nuevo Ticket</span>
          </button>
        }
      />

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Total de Tickets"
          value={totalTickets}
          icon={FiFileText}
          iconColor="text-blue-500"
        />
        <StatCard
          label="Pendientes"
          value={stats.pending}
          icon={FiClock}
          iconColor="text-orange-500"
        />
        <StatCard
          label="Resueltos"
          value={stats.resolved}
          icon={FiCheckCircle}
          iconColor="text-green-500"
        />
      </div>

      <Card>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar por número o título..."
              className="flex-1"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
            >
              Buscar
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
            >
              <FiFilter />
              <span>Filtros</span>
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as TicketStatus | '');
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prioridad
                </label>
                <select
                  value={priorityFilter}
                  onChange={(e) => {
                    setPriorityFilter(e.target.value as TicketPriority | '');
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : tickets.length === 0 ? (
          <EmptyState
            icon={FiFileText}
            title="No hay tickets"
            description="No se encontraron tickets. Crea tu primer ticket para comenzar."
            action={
              <button
                onClick={() => navigate('/tickets/create')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-200"
              >
                <FiPlus />
                <span>Crear Ticket</span>
              </button>
            }
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              data={tickets}
              onRowClick={handleRowClick}
              getRowKey={(ticket) => ticket.id}
              loading={loading}
              emptyMessage="No se encontraron tickets"
            />
            
            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
