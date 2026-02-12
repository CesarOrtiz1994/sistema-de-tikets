import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { getRoleLabel, getRoleBadgeColor } from '../utils/permissions';
import { FiLogOut, FiUser, FiMail, FiShield, FiCalendar, FiFileText, FiCheckCircle, FiClock } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { userRole } = usePermissions();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-gradient rounded-xl flex items-center justify-center shadow-lg">
                <FiFileText className="text-white text-xl" />
              </div>
              <h1 className="text-xl font-bold bg-brand-gradient bg-clip-text text-transparent">
                Sistema de Tickets
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-gray-100 rounded-full px-4 py-2 border border-gray-200">
                {user.profilePicture && (
                  <img
                    src={user.profilePicture}
                    alt={user.name}
                    className="w-8 h-8 rounded-full border-2 border-purple-500"
                  />
                )}
                <span className="text-sm font-medium text-gray-900">
                  {user.name}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all duration-200 border border-red-200"
              >
                <FiLogOut />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-brand-gradient rounded-2xl p-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-4xl font-bold text-white mb-2">
                Bienvenido al Dashboard
              </h2>
              <p className="text-purple-100 text-lg">
                Hola {user.name}, aquí está tu información
              </p>
            </div>
            <div className="hidden md:block">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6">
                <FiCheckCircle className="text-5xl text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Info Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Personal Info Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <FiUser className="text-2xl text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Información Personal</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Nombre:</span>
                <span className="text-gray-900 font-semibold">{user.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">ID:</span>
                <span className="text-gray-900 font-mono text-xs">{user.id.substring(0, 8)}...</span>
              </div>
            </div>
          </div>

          {/* Contact Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <FiMail className="text-2xl text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Contacto</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Email:</span>
                <span className="text-gray-900 font-semibold text-sm">{user.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Idioma:</span>
                <span className="text-gray-900 font-semibold uppercase">{user.language}</span>
              </div>
            </div>
          </div>

          {/* Role & Permissions Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <FiShield className="text-2xl text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Rol y Permisos</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Rol:</span>
                <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${userRole ? getRoleBadgeColor(userRole) : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                  {userRole ? getRoleLabel(userRole) : user.roleType}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Estado:</span>
                <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                  user.isActive 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {user.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>

          {/* Dates Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <FiCalendar className="text-2xl text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Fechas</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Creado:</span>
                <span className="text-gray-900 font-semibold">
                  {new Date(user.createdAt).toLocaleDateString('es-ES')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Actualizado:</span>
                <span className="text-gray-900 font-semibold">
                  {new Date(user.updatedAt).toLocaleDateString('es-ES')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Features Card */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
              <FiClock className="text-2xl text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Próximas Funcionalidades</h3>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: FiFileText, text: 'Gestión de tickets', color: 'from-blue-500 to-blue-600' },
              { icon: FiCheckCircle, text: 'Formularios dinámicos', color: 'from-green-500 to-green-600' },
              { icon: FiClock, text: 'Chat en tiempo real', color: 'from-purple-500 to-purple-600' },
              { icon: FiUser, text: 'Notificaciones', color: 'from-orange-500 to-orange-600' },
              { icon: FiShield, text: 'Métricas y reportes', color: 'from-pink-500 to-pink-600' },
            ].map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 border border-gray-200 hover:bg-gray-100 transition-all duration-200"
              >
                <div className={`w-10 h-10 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <feature.icon className="text-white" />
                </div>
                <span className="text-gray-900 font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
