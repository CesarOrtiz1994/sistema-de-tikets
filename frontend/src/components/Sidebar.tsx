import { useNavigate, useLocation } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { RoleType } from '../types/permissions';
import { 
  FiHome, 
  FiFileText, 
  FiUsers, 
  FiSettings, 
  FiShield,
  FiMenu,
  FiX,
  FiActivity,
  FiBriefcase,
  FiUserCheck,
  FiType,
  FiClock
} from 'react-icons/fi';

interface MenuItem {
  icon: any;
  label: string;
  path: string;
  roles: RoleType[];
  badge?: string;
}

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { userRole } = usePermissions();

  const menuItems: MenuItem[] = [
    {
      icon: FiHome,
      label: 'Dashboard',
      path: '/',
      roles: [RoleType.SUPER_ADMIN, RoleType.DEPT_ADMIN, RoleType.SUBORDINATE, RoleType.REQUESTER]
    },
    {
      icon: FiFileText,
      label: 'Mis Tickets',
      path: '/tickets',
      roles: [RoleType.SUPER_ADMIN, RoleType.DEPT_ADMIN, RoleType.SUBORDINATE, RoleType.REQUESTER]
    },
    {
      icon: FiUserCheck,
      label: 'Tickets Asignados',
      path: '/tickets/assigned',
      roles: [RoleType.SUPER_ADMIN, RoleType.DEPT_ADMIN, RoleType.SUBORDINATE]
    },
    {
      icon: FiBriefcase,
      label: 'Departamentos',
      path: '/departments',
      roles: [RoleType.SUPER_ADMIN, RoleType.DEPT_ADMIN]
    },
    {
      icon: FiUsers,
      label: 'Usuarios',
      path: '/users',
      roles: [RoleType.SUPER_ADMIN]
    },
    {
      icon: FiActivity,
      label: 'Auditoría',
      path: '/audit',
      roles: [RoleType.SUPER_ADMIN]
    },
    {
      icon: FiType,
      label: 'Tipos de Campos',
      path: '/field-types',
      roles: [RoleType.SUPER_ADMIN, RoleType.DEPT_ADMIN]
    },
    {
      icon: FiClock,
      label: 'Configuración SLA',
      path: '/sla-configurations',
      roles: [RoleType.SUPER_ADMIN, RoleType.DEPT_ADMIN]
    },
    {
      icon: FiSettings,
      label: 'Configuración',
      path: '/settings',
      roles: [RoleType.SUPER_ADMIN, RoleType.DEPT_ADMIN, RoleType.SUBORDINATE, RoleType.REQUESTER]
    }
  ];

  const visibleMenuItems = menuItems
    .filter(item => userRole && item.roles.includes(userRole))
    .map(item => {
      // Cambiar label de "Departamentos" a "Mi Departamento" para DEPT_ADMIN
      if (item.path === '/departments' && userRole === RoleType.DEPT_ADMIN) {
        return { ...item, label: 'Mi Departamento' };
      }
      return item;
    });

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <aside className={`fixed top-0 left-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-40 shadow-lg ${isOpen ? 'w-64' : 'w-20'}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 mx-4 mb-4">
          <div className="flex items-center justify-between">
            {isOpen && (
              <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Tickets
              </h2>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600 ml-auto"
              title={isOpen ? 'Minimizar' : 'Expandir'}
            >
              {isOpen ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {visibleMenuItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={index}
                onClick={() => handleNavigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={!isOpen ? item.label : ''}
              >
                <item.icon className="text-xl flex-shrink-0" />
                {isOpen && (
                  <div className="flex items-center justify-between flex-1">
                    <span className="font-medium text-sm">{item.label}</span>
                    {item.badge && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        isActive 
                          ? 'bg-white/20 text-white' 
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
                {/* Tooltip cuando está minimizado */}
                {!isOpen && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                    {item.badge && (
                      <span className="ml-2 text-xs bg-purple-500 px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Role Badge */}
        {userRole && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            {isOpen ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-1">
                  <FiShield className="text-purple-600 dark:text-purple-400" />
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Tu Rol</span>
                </div>
                <p className="text-xs font-bold text-purple-700 dark:text-purple-400">
                  {userRole === RoleType.SUPER_ADMIN && 'Super Administrador'}
                  {userRole === RoleType.DEPT_ADMIN && 'Admin de Departamento'}
                  {userRole === RoleType.SUBORDINATE && 'Subordinado'}
                  {userRole === RoleType.REQUESTER && 'Solicitante'}
                </p>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="p-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg" title="Tu rol">
                  <FiShield className="text-purple-600 text-xl" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
