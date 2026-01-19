import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import RoleGuard from '../components/RoleGuard';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
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

  const getActionBadgeVariant = (action: string): 'success' | 'info' | 'danger' | 'gray' => {
    if (action.includes('CREATE')) return 'success';
    if (action.includes('UPDATE')) return 'info';
    if (action.includes('DELETE')) return 'danger';
    return 'gray';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <RoleGuard 
      roles={[RoleType.SUPER_ADMIN]}
      fallback={
        <Card padding="lg">
          <div className="text-center py-12">
            <FiShield className="text-6xl text-red-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">Acceso Denegado</h3>
            <p className="text-red-500 dark:text-red-400">Solo los Super Administradores pueden acceder a esta sección</p>
          </div>
        </Card>
      }
    >
      <div className="space-y-6">
        <PageHeader
          title="Auditoría del Sistema"
          description="Registro de todas las acciones críticas del sistema"
        />

        <Card>
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
        </Card>

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
                <Badge variant={getActionBadgeVariant(log.action)} size="sm">
                  {log.action}
                </Badge>
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
                <Badge variant={log.status === 'success' ? 'success' : 'danger'} size="sm">
                  {log.status === 'success' ? 'Exitoso' : 'Error'}
                </Badge>
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
