import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { RoleType } from '../types/permissions';
import RoleGuard from '../components/RoleGuard';
import { 
  FiFileText, 
  FiClock, 
  FiCheckCircle, 
  FiAlertCircle,
  FiUsers,
  FiTrendingUp,
  FiActivity,
  FiShield
} from 'react-icons/fi';

export default function DashboardHomePage() {
  const { user } = useAuth();
  const { userRole } = usePermissions();

  if (!user) return null;

  const stats = [
    { label: 'Total Tickets', value: '0', icon: FiFileText, color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
    { label: 'En Progreso', value: '0', icon: FiClock, color: 'from-orange-500 to-orange-600', bgColor: 'bg-orange-50', textColor: 'text-orange-600' },
    { label: 'Completados', value: '0', icon: FiCheckCircle, color: 'from-green-500 to-green-600', bgColor: 'bg-green-50', textColor: 'text-green-600' },
    { label: 'Urgentes', value: '0', icon: FiAlertCircle, color: 'from-red-500 to-red-600', bgColor: 'bg-red-50', textColor: 'text-red-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-bold text-white mb-2">
              ¡Bienvenido, {user.name}!
            </h2>
            <p className="text-purple-100 text-lg">
              {userRole === RoleType.SUPER_ADMIN && '🔑 Tienes acceso completo al sistema'}
              {userRole === RoleType.DEPT_ADMIN && '👔 Gestiona tu departamento y equipo'}
              {userRole === RoleType.SUBORDINATE && '💼 Gestiona tus tickets asignados'}
              {userRole === RoleType.REQUESTER && '📝 Crea y gestiona tus solicitudes'}
            </p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6">
              <FiShield className="text-5xl text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                <stat.icon className="text-2xl text-white" />
              </div>
              <FiTrendingUp className="text-green-500" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</h3>
            <p className="text-gray-600 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Role-Specific Content */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Super Admin Panel */}
        <RoleGuard roles={[RoleType.SUPER_ADMIN]}>
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <FiShield className="text-2xl text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Panel de Super Admin</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <span className="text-sm font-medium text-gray-700">Usuarios Totales</span>
                <span className="text-lg font-bold text-red-600">0</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                <span className="text-sm font-medium text-gray-700">Departamentos</span>
                <span className="text-lg font-bold text-purple-600">0</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-sm font-medium text-gray-700">Logs de Auditoría</span>
                <span className="text-lg font-bold text-blue-600">0</span>
              </div>
            </div>
          </div>
        </RoleGuard>

        {/* Department Admin Panel */}
        <RoleGuard roles={[RoleType.DEPT_ADMIN]}>
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <FiUsers className="text-2xl text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Mi Departamento</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                <span className="text-sm font-medium text-gray-700">Miembros del Equipo</span>
                <span className="text-lg font-bold text-purple-600">0</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-sm font-medium text-gray-700">Tickets del Depto</span>
                <span className="text-lg font-bold text-blue-600">0</span>
              </div>
            </div>
          </div>
        </RoleGuard>

        {/* Activity Feed */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <FiActivity className="text-2xl text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Actividad Reciente</h3>
          </div>
          <div className="space-y-3">
            <p className="text-gray-500 text-sm text-center py-8">
              No hay actividad reciente
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <FiFileText className="text-2xl text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Acciones Rápidas</h3>
          </div>
          <div className="space-y-2">
            <button className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-all duration-200">
              <span className="text-sm font-medium text-blue-700">Crear Nuevo Ticket</span>
            </button>
            <RoleGuard roles={[RoleType.SUPER_ADMIN, RoleType.DEPT_ADMIN]}>
              <button className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-all duration-200">
                <span className="text-sm font-medium text-purple-700">Asignar Tickets</span>
              </button>
            </RoleGuard>
            <button className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-all duration-200">
              <span className="text-sm font-medium text-green-700">Ver Mis Tickets</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
