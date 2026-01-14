import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  FiLogOut, 
  FiHome, 
  FiFileText, 
  FiUsers, 
  FiSettings, 
  FiBell,
  FiSearch,
  FiMenu,
  FiX,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiTrendingUp
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Cargando...</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Tickets', value: '0', icon: FiFileText, color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
    { label: 'En Progreso', value: '0', icon: FiClock, color: 'from-orange-500 to-orange-600', bgColor: 'bg-orange-50', textColor: 'text-orange-600' },
    { label: 'Completados', value: '0', icon: FiCheckCircle, color: 'from-green-500 to-green-600', bgColor: 'bg-green-50', textColor: 'text-green-600' },
    { label: 'Urgentes', value: '0', icon: FiAlertCircle, color: 'from-red-500 to-red-600', bgColor: 'bg-red-50', textColor: 'text-red-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-30 shadow-sm ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            {sidebarOpen && (
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Tickets
              </h2>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600"
            >
              {sidebarOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>

          <nav className="space-y-2">
            {[
              { icon: FiHome, label: 'Dashboard', active: true },
              { icon: FiFileText, label: 'Tickets', active: false },
              { icon: FiUsers, label: 'Equipo', active: false },
              { icon: FiSettings, label: 'Configuración', active: false },
            ].map((item, index) => (
              <button
                key={index}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  item.active
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon className="text-xl flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            ))}
          </nav>
        </div>

        {/* User Profile in Sidebar */}
        {sidebarOpen && (
          <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              {user.profilePicture && (
                <img
                  src={user.profilePicture}
                  alt={user.name}
                  className="w-10 h-10 rounded-full border-2 border-purple-500"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.roleType}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition font-medium"
            >
              <FiLogOut />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 max-w-xl">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar tickets..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button className="relative p-2 hover:bg-gray-100 rounded-xl transition">
                  <FiBell className="text-xl text-gray-600" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6 space-y-6">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Bienvenido, {user.name}
                </h1>
                <p className="text-purple-100">
                  Aquí está el resumen de tus tickets de hoy
                </p>
              </div>
              <div className="hidden md:block">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6">
                  <FiTrendingUp className="text-5xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                    <stat.icon className="text-2xl text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    Hoy
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Recent Activity & User Info */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Actividad Reciente</h3>
              <div className="space-y-4">
                {[1, 2, 3].map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FiFileText className="text-white text-xl" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        No hay tickets aún
                      </p>
                      <p className="text-sm text-gray-500">
                        Crea tu primer ticket para comenzar
                      </p>
                    </div>
                    <div className="text-xs text-gray-400">
                      Ahora
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* User Info Card */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Mi Perfil</h3>
              <div className="space-y-4">
                <div className="text-center pb-4 border-b border-gray-200">
                  {user.profilePicture && (
                    <img
                      src={user.profilePicture}
                      alt={user.name}
                      className="w-20 h-20 rounded-full border-4 border-purple-500 mx-auto mb-3"
                    />
                  )}
                  <h4 className="font-bold text-gray-900">{user.name}</h4>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Rol</span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      {user.roleType}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Estado</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Idioma</span>
                    <span className="text-sm font-medium text-gray-900">{user.language}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Miembro desde</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(user.createdAt).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
