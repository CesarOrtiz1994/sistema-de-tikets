import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { RoleType } from '../types/permissions';
import {
  FiFileText,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiUsers,
  FiBriefcase,
  FiShield,
  FiAlertTriangle,
  FiStar,
  FiTrendingUp,
  FiPlus,
  FiExternalLink,
  FiXCircle
} from 'react-icons/fi';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Card from '../components/common/Card';
import { BadgeVariant } from '../components/common/Badge';
import {
  metricsService,
  DashboardMetrics,
  TicketsByDepartment,
  TicketTrend,
  SlaCompliance,
  Satisfaction,
  AvgResolutionTime,
  DepartmentOption,
  MetricsFilters
} from '../services/metrics.service';
import { toast } from 'sonner';
import { formatDate } from '../utils/dateUtils';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Area, AreaChart
} from 'recharts';

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nuevo', ASSIGNED: 'Asignado', IN_PROGRESS: 'En Progreso',
  WAITING: 'En Espera', RESOLVED: 'Resuelto', CLOSED: 'Cerrado', CANCELLED: 'Cancelado'
};

const STATUS_COLORS: Record<string, string> = {
  NEW: '#3B82F6', ASSIGNED: '#6B7280', IN_PROGRESS: '#F59E0B',
  WAITING: '#F97316', RESOLVED: '#10B981', CLOSED: '#6B7280', CANCELLED: '#EF4444'
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta', CRITICAL: 'Crítica'
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#10B981', MEDIUM: '#3B82F6', HIGH: '#F97316', CRITICAL: '#EF4444'
};

const STATUS_BADGE: Record<string, BadgeVariant> = {
  NEW: 'info', ASSIGNED: 'gray', IN_PROGRESS: 'warning',
  WAITING: 'orange', RESOLVED: 'success', CLOSED: 'gray', CANCELLED: 'danger'
};

const PRIORITY_BADGE: Record<string, BadgeVariant> = {
  LOW: 'green', MEDIUM: 'yellow', HIGH: 'orange', CRITICAL: 'red'
};

const PERIOD_OPTIONS = [
  { value: 'week', label: 'Última semana' },
  { value: 'month', label: 'Último mes' },
  { value: 'quarter', label: 'Último trimestre' },
  { value: 'year', label: 'Último año' }
];

export default function DashboardHomePage() {
  const { user } = useAuth();
  const { userRole } = usePermissions();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardMetrics | null>(null);
  const [ticketsByDept, setTicketsByDept] = useState<TicketsByDepartment[]>([]);
  const [trend, setTrend] = useState<TicketTrend[]>([]);
  const [sla, setSla] = useState<SlaCompliance | null>(null);
  const [satisfaction, setSatisfaction] = useState<Satisfaction | null>(null);
  const [avgResolution, setAvgResolution] = useState<AvgResolutionTime | null>(null);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);

  // Filtros
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const filters: MetricsFilters = {
        period,
        ...(selectedDept ? { departmentId: selectedDept } : {})
      };

      const [dashData, deptData, trendData, slaData, satData, avgData] = await Promise.all([
        metricsService.getDashboard(filters),
        (userRole !== RoleType.REQUESTER)
          ? metricsService.getTicketsByDepartment(filters)
          : Promise.resolve([]),
        metricsService.getTicketsTrend(filters),
        metricsService.getSlaCompliance(filters),
        metricsService.getSatisfaction(filters),
        metricsService.getAvgResolutionTime(filters)
      ]);

      setDashboard(dashData);
      setTicketsByDept(deptData);
      setTrend(trendData);
      setSla(slaData);
      setSatisfaction(satData);
      setAvgResolution(avgData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Error al cargar métricas');
    } finally {
      setLoading(false);
    }
  }, [selectedDept, period, userRole]);

  useEffect(() => {
    metricsService.getUserDepartments().then(setDepartments).catch(() => {});
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (!user) return null;

  if (loading && !dashboard) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold text-white">¡Bienvenido, {user.name}!</h2>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  const d = dashboard!;

  // Datos para gráfica de dona (status)
  const statusPieData = Object.entries(d.statusBreakdown)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      name: STATUS_LABELS[status] || status,
      value: count,
      color: STATUS_COLORS[status] || '#6B7280'
    }));

  // Datos para gráfica de dona (prioridad)
  const priorityPieData = Object.entries(d.priorityBreakdown)
    .filter(([, count]) => count > 0)
    .map(([priority, count]) => ({
      name: PRIORITY_LABELS[priority] || priority,
      value: count,
      color: PRIORITY_COLORS[priority] || '#6B7280'
    }));

  return (
    <div className="space-y-8">
      {/* ═══════════════════════ BIENVENIDA ═══════════════════════ */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              ¡Bienvenido, {user.name}!
            </h2>
            <p className="text-purple-100 text-lg">
              {userRole === RoleType.SUPER_ADMIN && 'Tienes acceso completo al sistema'}
              {userRole === RoleType.DEPT_ADMIN && 'Gestiona tu departamento y equipo'}
              {userRole === RoleType.SUBORDINATE && 'Gestiona tus tickets asignados'}
              {userRole === RoleType.REQUESTER && 'Crea y gestiona tus solicitudes'}
            </p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6">
              <FiShield className="text-5xl text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════ FILTROS ═══════════════════════ */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Filtrar por:</span>
        {departments.length > 0 && (
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Todos los departamentos</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        )}
        <select
          value={period}
          onChange={e => setPeriod(e.target.value as any)}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
        >
          {PERIOD_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* ═══════════════════════ RESUMEN DE TICKETS ═══════════════════════ */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FiFileText className="text-blue-500" /> Resumen de Tickets
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Total de Tickets" value={d.totalTickets} icon={FiFileText} iconColor="text-blue-500" />
          <StatCard label="Pendientes" value={d.pending} icon={FiClock} iconColor="text-orange-500" />
          <StatCard label="En Progreso" value={d.inProgress} icon={FiTrendingUp} iconColor="text-yellow-500" />
          <StatCard label="Resueltos" value={d.resolved} icon={FiCheckCircle} iconColor="text-green-500" />
          <StatCard label="Cancelados" value={d.cancelled} icon={FiXCircle} iconColor="text-red-500" />
        </div>
      </section>

      {/* ═══════════════════════ RENDIMIENTO Y SLA ═══════════════════════ */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FiTrendingUp className="text-green-500" /> Rendimiento y SLA
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="En Espera" value={d.waiting} icon={FiAlertTriangle} iconColor="text-amber-500" />
          <StatCard label="SLA Excedido" value={d.slaExceeded} icon={FiAlertCircle} iconColor="text-red-500" />
          {avgResolution && (
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FiClock className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tiempo Prom. Resolución</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{avgResolution.avgHours}h</p>
                  <p className="text-xs text-gray-400">{avgResolution.count} tickets resueltos</p>
                </div>
              </div>
            </Card>
          )}
          {sla && (
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FiCheckCircle className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Cumplimiento SLA</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{sla.complianceRate}%</p>
                  <p className="text-xs text-gray-400">{sla.onTime} a tiempo / {sla.total} total</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </section>

      {/* ═══════════════════════ SATISFACCIÓN Y SISTEMA (ADMIN) ═══════════════════════ */}
      {(userRole === RoleType.SUPER_ADMIN || userRole === RoleType.DEPT_ADMIN) && (
        <section>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FiShield className="text-purple-500" />
            {userRole === RoleType.SUPER_ADMIN ? 'Sistema y Satisfacción' : 'Departamento y Satisfacción'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {satisfaction && (
              <Card>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FiStar className="text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Satisfacción</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{satisfaction.avgRating}/5</p>
                    <p className="text-xs text-gray-400">{satisfaction.count} calificaciones</p>
                  </div>
                </div>
              </Card>
            )}
            {userRole === RoleType.SUPER_ADMIN && (
              <>
                <StatCard label="Usuarios Activos" value={d.totalUsers} icon={FiUsers} iconColor="text-purple-500" />
                <StatCard label="Departamentos" value={d.totalDepartments} icon={FiBriefcase} iconColor="text-indigo-500" />
              </>
            )}
            {userRole === RoleType.DEPT_ADMIN && (
              <>
                <StatCard label="Miembros del Equipo" value={d.totalUsers} icon={FiUsers} iconColor="text-purple-500" />
                <StatCard label="Mis Departamentos" value={d.totalDepartments} icon={FiBriefcase} iconColor="text-indigo-500" />
              </>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════════════ GRÁFICAS ═══════════════════════ */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FiTrendingUp className="text-blue-500" /> Análisis Visual
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dona: Tickets por Estado */}
          <Card>
            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiFileText className="text-blue-500" /> Tickets por Estado
            </h4>
            {statusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-sm text-center py-12">Sin datos</p>
            )}
          </Card>

          {/* Dona: Tickets por Prioridad */}
          <Card>
            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiAlertCircle className="text-orange-500" /> Tickets por Prioridad
            </h4>
            {priorityPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={priorityPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {priorityPieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-sm text-center py-12">Sin datos</p>
            )}
          </Card>

          {/* Barras: Tickets por Departamento */}
          {userRole !== RoleType.REQUESTER && ticketsByDept.length > 0 && (
            <Card>
              <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FiBriefcase className="text-purple-500" /> Tickets por Departamento
              </h4>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={ticketsByDept}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="departmentName"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Tickets" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Área: Tendencia de Tickets */}
          {trend.length > 0 && (
            <Card>
              <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FiTrendingUp className="text-green-500" /> Tendencia de Tickets
              </h4>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(val: string) => {
                      const dt = new Date(val);
                      return `${dt.getDate()}/${dt.getMonth() + 1}`;
                    }}
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    labelFormatter={(val) => {
                      const dt = new Date(String(val));
                      return dt.toLocaleDateString('es-MX');
                    }}
                  />
                  <Area type="monotone" dataKey="created" name="Creados" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} />
                  <Area type="monotone" dataKey="resolved" name="Resueltos" stroke="#10B981" fill="#10B981" fillOpacity={0.1} />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      </section>

      {/* ═══════════════════════ TICKETS RECIENTES + ACCIONES ═══════════════════════ */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FiFileText className="text-purple-500" /> Actividad Reciente
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets Recientes */}
          <div className="lg:col-span-2">
            <Card>
              <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Últimos Tickets</h4>
              {d.recentTickets.length > 0 ? (
                <div className="space-y-3">
                  {d.recentTickets.map(ticket => (
                    <div
                      key={ticket.id}
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 cursor-pointer transition"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-purple-600 dark:text-purple-400">{ticket.ticketNumber}</span>
                          <Badge variant={STATUS_BADGE[ticket.status] || 'gray'} size="sm">
                            {STATUS_LABELS[ticket.status] || ticket.status}
                          </Badge>
                          <Badge variant={PRIORITY_BADGE[ticket.priority] || 'gray'} size="sm">
                            {PRIORITY_LABELS[ticket.priority] || ticket.priority}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{ticket.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {ticket.department.name} · {ticket.requester.name} · {formatDate(ticket.createdAt)}
                        </p>
                      </div>
                      <FiExternalLink className="text-gray-400 ml-2 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm text-center py-8">No hay tickets recientes</p>
              )}
            </Card>
          </div>

          {/* Acciones Rápidas */}
          <Card>
            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Acciones Rápidas</h4>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/tickets/create')}
                className="w-full text-left px-4 py-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800 transition flex items-center gap-2"
              >
                <FiPlus className="text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Crear Nuevo Ticket</span>
              </button>
              <button
                onClick={() => navigate('/tickets')}
                className="w-full text-left px-4 py-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800 transition flex items-center gap-2"
              >
                <FiFileText className="text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">Ver Mis Tickets</span>
              </button>
              {(userRole === RoleType.SUPER_ADMIN || userRole === RoleType.DEPT_ADMIN) && (
                <button
                  onClick={() => navigate('/tickets/kanban')}
                  className="w-full text-left px-4 py-3 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800 transition flex items-center gap-2"
                >
                  <FiBriefcase className="text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Tablero Kanban</span>
                </button>
              )}
              {userRole === RoleType.SUPER_ADMIN && (
                <button
                  onClick={() => navigate('/users')}
                  className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition flex items-center gap-2"
                >
                  <FiUsers className="text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Gestionar Usuarios</span>
                </button>
              )}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
