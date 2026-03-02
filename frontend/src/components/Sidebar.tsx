import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { RoleType } from '../types/permissions';
import { useBranding } from '../contexts/BrandingContext';
import { useTheme } from '../hooks/useTheme';
import { 
  FiHome, 
  FiFileText, 
  FiUsers, 
  FiShield,
  FiMenu,
  FiX,
  FiActivity,
  FiBriefcase,
  FiType,
  FiClock,
  FiEdit3,
  FiColumns,
  FiMail,
  FiDroplet
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
  const { branding, getLogoUrl } = useBranding();
  const { theme } = useTheme();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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
      icon: FiBriefcase,
      label: 'Tickets',
      path: '/tickets/department',
      roles: [RoleType.SUPER_ADMIN]
    },
    {
      icon: FiColumns,
      label: userRole === RoleType.DEPT_ADMIN ? 'Tickets del Departamento' : 'Tickets Asignados',
      path: '/tickets/kanban',
      roles: [RoleType.DEPT_ADMIN, RoleType.SUBORDINATE]
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
      roles: [RoleType.SUPER_ADMIN]
    },
    {
      icon: FiEdit3,
      label: 'Formularios',
      path: '/forms',
      roles: [RoleType.SUPER_ADMIN, RoleType.DEPT_ADMIN]
    },
    {
      icon: FiMail,
      label: 'Email Templates',
      path: '/email-templates',
      roles: [RoleType.SUPER_ADMIN]
    },
    {
      icon: FiClock,
      label: 'Configuración SLA',
      path: '/sla-configurations',
      roles: [RoleType.SUPER_ADMIN]
    },
    {
      icon: FiDroplet,
      label: 'Personalización',
      path: '/branding',
      roles: [RoleType.SUPER_ADMIN]
    },
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
    <aside
      className={`fixed top-0 left-0 h-full border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-40 shadow-lg ${isOpen ? 'w-64' : 'w-20'}`}
      style={{ backgroundColor: theme === 'dark' ? '#1f2937' : branding.sidebarBgColor }}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 mb-4">
          <div className="flex items-center justify-between">
            {isOpen && (
              branding.logoUrl ? (
                <img
                  src={getLogoUrl(branding.logoUrl) || ''}
                  alt={branding.appName}
                  className="h-8 max-w-[140px] object-contain"
                />
              ) : (
                <h2 className="text-xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(to right, ${branding.primaryColor}, ${branding.secondaryColor})` }}>
                  {branding.appName}
                </h2>
              )
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
                onMouseEnter={() => !isActive && setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-white shadow-lg'
                    : ''
                }`}
                style={
                  isActive
                    ? { background: `linear-gradient(to right, ${branding.primaryColor}, ${branding.secondaryColor})` }
                    : hoveredIndex === index
                      ? { backgroundColor: `${branding.primaryColor}15`, color: branding.sidebarTextColor }
                      : { color: theme === 'dark' ? '#d1d5db' : branding.sidebarTextColor }
                }
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
                  <FiShield style={{ color: branding.primaryColor }} />
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Tu Rol</span>
                </div>
                <p className="text-xs font-bold" style={{ color: branding.primaryColor }}>
                  {userRole === RoleType.SUPER_ADMIN && 'Super Administrador'}
                  {userRole === RoleType.DEPT_ADMIN && 'Admin de Departamento'}
                  {userRole === RoleType.SUBORDINATE && 'Subordinado'}
                  {userRole === RoleType.REQUESTER && 'Solicitante'}
                </p>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="p-2 rounded-lg" style={{ background: `linear-gradient(to right, ${branding.primaryColor}20, ${branding.secondaryColor}20)` }} title="Tu rol">
                  <FiShield className="text-xl" style={{ color: branding.primaryColor }} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
