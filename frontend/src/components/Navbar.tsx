import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { getRoleLabel } from '../utils/permissions';
import { FiLogOut, FiSearch, FiFileText, FiSun, FiMoon } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import NotificationCenter from './Notifications/NotificationCenter';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { userRole } = usePermissions();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <FiFileText className="text-white text-xl" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-blue-400">
              SCOT
            </h1>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2 border border-gray-200 dark:border-gray-600">
              <FiSearch className="text-gray-400 dark:text-gray-300" />
              <input
                type="text"
                placeholder="Buscar tickets..."
                className="bg-transparent outline-none text-sm text-gray-700 dark:text-white w-48 placeholder:text-gray-400 dark:placeholder:text-gray-400"
              />
            </div>

            {/* Notifications */}
            <NotificationCenter />

            {/* Theme Toggle */}
            <button
              onClick={() => {
                console.log('Toggle theme clicked, current:', theme);
                toggleTheme();
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-gray-600 dark:text-gray-300"
              title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
            >
              {theme === 'light' ? <FiMoon className="text-xl" /> : <FiSun className="text-xl" />}
            </button>

            {/* User Info */}
            <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl px-4 py-2 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border-2 border-purple-500"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent && !parent.querySelector('.fallback-avatar')) {
                      const fallback = document.createElement('div');
                      fallback.className = 'fallback-avatar w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-semibold text-sm';
                      fallback.textContent = user.name.charAt(0).toUpperCase();
                      parent.insertBefore(fallback, e.currentTarget);
                    }
                  }}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                {userRole && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{getRoleLabel(userRole)}</p>
                )}
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all duration-200 border border-red-200"
            >
              <FiLogOut />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
