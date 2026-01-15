import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import RoleGuard from '../components/RoleGuard';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import { RoleType } from '../types/permissions';
import { 
  FiShield, 
  FiRefreshCw,
  FiAlertCircle
} from 'react-icons/fi';
import auditService, { AuditLog, AuditFilters } from '../services/audit.service';

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AuditFilters>({
    page: 1,
    limit: 10
  });
  const [totalPages, setTotalPages] = useState(1);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, [filters.page, filters.action, filters.resource, filters.status]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await auditService.getLogs(filters);
      console.log('Audit response:', response);
      setLogs(response.logs || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error al cargar logs de auditoría:', error);
      toast.error('Error al cargar logs de auditoría', {
        description: 'Ruta no encontrada: GET /audit'
      });
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    };
    return styles[status as keyof typeof styles] || styles.success;
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'text-green-600 dark:text-green-400';
    if (action.includes('UPDATE')) return 'text-blue-600 dark:text-blue-400';
    if (action.includes('DELETE')) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <RoleGuard 
      roles={[RoleType.SUPER_ADMIN]}
      fallback={
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-red-200 dark:border-red-800 shadow-sm transition-colors">
          <div className="text-center py-12">
            <FiShield className="text-6xl text-red-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">Acceso Denegado</h3>
            <p className="text-red-500 dark:text-red-400">Solo los Super Administradores pueden acceder a esta sección</p>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Auditoría del Sistema</h1>
          <p className="text-gray-600 dark:text-gray-300">Registro de todas las acciones críticas del sistema</p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 transition-colors">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filters.action || ''}
              onChange={(e) => setFilters({ ...filters, action: e.target.value || undefined, page: 1 })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Todas las acciones</option>
              <option value="CREATE">Crear</option>
              <option value="UPDATE">Actualizar</option>
              <option value="DELETE">Eliminar</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
            </select>

            <select
              value={filters.resource || ''}
              onChange={(e) => setFilters({ ...filters, resource: e.target.value || undefined, page: 1 })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Todos los recursos</option>
              <option value="user">Usuarios</option>
              <option value="department">Departamentos</option>
              <option value="auth">Autenticación</option>
            </select>

            <select
              value={filters.status || ''}
              onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined, page: 1 })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Todos los estados</option>
              <option value="success">Exitoso</option>
              <option value="error">Error</option>
            </select>

            <button
              onClick={loadLogs}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-900 dark:text-gray-200"
            >
              <FiRefreshCw />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <DataTable
          data={logs}
          columns={[
            {
              key: 'date',
              header: 'Fecha',
              render: (log: AuditLog) => (
                <div className="text-sm text-gray-900 dark:text-white">
                  {new Date(log.createdAt).toLocaleString('es-ES')}
                </div>
              )
            },
            {
              key: 'user',
              header: 'Usuario',
              render: (log: AuditLog) => (
                <div className="text-sm text-gray-900 dark:text-white">
                  {log.user?.name || 'Sistema'}
                </div>
              )
            },
            {
              key: 'action',
              header: 'Acción',
              render: (log: AuditLog) => (
                <span className={`text-sm font-medium ${getActionColor(log.action)}`}>
                  {log.action}
                </span>
              )
            },
            {
              key: 'resource',
              header: 'Recurso',
              render: (log: AuditLog) => (
                <div className="text-sm text-gray-900 dark:text-white">
                  {log.resource}
                </div>
              )
            },
            {
              key: 'status',
              header: 'Estado',
              render: (log: AuditLog) => (
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(log.status)}`}>
                  {log.status === 'success' ? 'Exitoso' : 'Error'}
                </span>
              )
            },
            {
              key: 'ip',
              header: 'IP',
              render: (log: AuditLog) => (
                <div className="text-sm text-gray-500 dark:text-gray-300">
                  {log.ipAddress || 'N/A'}
                </div>
              )
            }
          ]}
          loading={loading}
          emptyMessage="No se encontraron registros con los filtros aplicados"
          emptyIcon={<FiAlertCircle />}
          getRowKey={(log) => log.id}
          onRowClick={(log) => setExpandedLog(expandedLog === log.id ? null : log.id)}
        />

        {/* Expanded Log Details */}
        {logs.map(log => expandedLog === log.id && (
          <div key={`details-${log.id}`} className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg mt-2">
            <div className="space-y-4">
              <div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Detalles:</span>
                <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto text-gray-900 dark:text-gray-100">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              </div>
              {log.errorMessage && (
                <div>
                  <span className="text-sm font-semibold text-red-700 dark:text-red-400">Error:</span>
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{log.errorMessage}</p>
                </div>
              )}
              <div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">User Agent:</span>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{log.userAgent || 'N/A'}</p>
              </div>
            </div>
          </div>
        ))}

        <Pagination
          currentPage={filters.page || 1}
          totalPages={totalPages}
          onPageChange={(page) => setFilters({ ...filters, page })}
        />
      </div>
    </RoleGuard>
  );
}
