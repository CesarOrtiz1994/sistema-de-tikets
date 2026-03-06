import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { FiPlus, FiFilter, FiFileText, FiClock, FiCheckCircle, FiCalendar } from 'react-icons/fi';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import DataTable from '../components/common/DataTable';
import Badge from '../components/common/Badge';
import UnreadBadge from '../components/common/UnreadBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/common/EmptyState';
import SearchInput from '../components/common/SearchInput';
import StatCard from '../components/common/StatCard';
import { useUnreadMessages } from '../contexts/UnreadMessagesContext';
import { ticketsService, Ticket, TicketStatus, TicketPriority } from '../services/tickets.service';
import { BadgeVariant } from '../components/common/Badge';
import { formatDate } from '../utils/dateUtils';
import { usePageTitle } from '../hooks/usePageTitle';

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
  usePageTitle('Tickets');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unreadCounts } = useUnreadMessages();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);
  const [stats, setStats] = useState({ pending: 0, resolved: 0 });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | ''>('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'custom'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadTickets();
    }
  }, [currentPage, statusFilter, priorityFilter, dateFilter, dateFrom, dateTo, user?.id]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        setLoading(false);
        return;
      }
      
      // SOLO tickets creados por el usuario actual (Mis Tickets)
      // Forzamos requesterId para que TODOS los roles vean solo sus tickets
      
      // Calcular fechas según el filtro seleccionado
      let calculatedDateFrom: string | undefined;
      let calculatedDateTo: string | undefined;
      
      if (dateFilter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        calculatedDateFrom = today.toISOString();
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        calculatedDateTo = endOfDay.toISOString();
      } else if (dateFilter === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        calculatedDateFrom = yesterday.toISOString();
        const endOfYesterday = new Date();
        endOfYesterday.setDate(endOfYesterday.getDate() - 1);
        endOfYesterday.setHours(23, 59, 59, 999);
        calculatedDateTo = endOfYesterday.toISOString();
      } else if (dateFilter === 'custom' && dateFrom && dateTo) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        calculatedDateFrom = fromDate.toISOString();
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        calculatedDateTo = toDate.toISOString();
      }
      
      const response = await ticketsService.listTickets({
        page: currentPage,
        limit: 10,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        search: searchTerm || undefined,
        requesterId: user.id, // FORZAR: Solo tickets que YO creé
        dateFrom: calculatedDateFrom,
        dateTo: calculatedDateTo,
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
      render: (ticket: Ticket) => {
        const unreadCount = unreadCounts[ticket.id] || 0;
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
              {ticket.ticketNumber}
            </span>
            {unreadCount > 0 && <UnreadBadge count={unreadCount} />}
          </div>
        );
      },
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
          {ticket.assignments && ticket.assignments.length > 0 
            ? ticket.assignments.map(a => a.user.name).join(', ')
            : 'Sin asignar'}
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
            className="flex items-center gap-2 px-4 py-2 bg-brand-gradient bg-brand-gradient-hover text-white rounded-xl hover:shadow-lg transition-all duration-200"
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
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              {/* Filtro de Fechas */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <FiCalendar className="text-blue-500" />
                  Fecha de Creación
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <select
                      value={dateFilter}
                      onChange={(e) => {
                        const value = e.target.value as 'all' | 'today' | 'yesterday' | 'custom';
                        setDateFilter(value);
                        if (value !== 'custom') {
                          setDateFrom('');
                          setDateTo('');
                        }
                        setCurrentPage(1);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="all">Todas las fechas</option>
                      <option value="today">Hoy</option>
                      <option value="yesterday">Ayer</option>
                      <option value="custom">Rango personalizado</option>
                    </select>
                  </div>
                  
                  {dateFilter === 'custom' && (
                    <>
                      <div>
                        <input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => {
                            setDateFrom(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Desde"
                        />
                      </div>
                      <div>
                        <input
                          type="date"
                          value={dateTo}
                          onChange={(e) => {
                            setDateTo(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Hasta"
                        />
                      </div>
                    </>
                  )}
                </div>
                {dateFilter === 'custom' && (!dateFrom || !dateTo) && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                    ⚠️ Selecciona ambas fechas para aplicar el filtro personalizado
                  </p>
                )}
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
                className="flex items-center gap-2 px-4 py-2 bg-brand-gradient bg-brand-gradient-hover text-white rounded-xl hover:shadow-lg transition-all duration-200"
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
