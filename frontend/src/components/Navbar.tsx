import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { getRoleLabel } from '../utils/permissions';
import { FiLogOut, FiFileText, FiSun, FiMoon } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { useBranding } from '../contexts/BrandingContext';
import NotificationCenter from './Notifications/NotificationCenter';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { userRole } = usePermissions();
  const { theme, toggleTheme } = useTheme();
  const { branding, getLogoUrl } = useBranding();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
      <div className="max-w-full pl-9 ml-7 pr-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Title */}
          <div className="flex items-center gap-3 ml-7">
            {branding.logoSmallUrl ? (
              <img
                src={getLogoUrl(branding.logoSmallUrl) || ''}
                alt={branding.appName}
                className="h-10 max-w-[160px] rounded-xl object-contain"
              />
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(to bottom right, ${branding.primaryColor}, ${branding.secondaryColor})` }}>
                  <FiFileText className="text-white text-xl" />
                </div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(to right, ${branding.primaryColor}, ${branding.secondaryColor})` }}>
                  {branding.appName}
                </h1>
              </>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">

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
