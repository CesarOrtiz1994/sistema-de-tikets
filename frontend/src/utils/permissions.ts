import { RoleType, Permissions } from '../types/permissions';

export const getRoleLabel = (role: RoleType): string => {
  const labels: Record<RoleType, string> = {
    [RoleType.SUPER_ADMIN]: 'Super Admin',
    [RoleType.DEPT_ADMIN]: 'Admin Depto.',
    [RoleType.SUBORDINATE]: 'Subordinado',
    [RoleType.REQUESTER]: 'Solicitante'
  };
  return labels[role] || role;
};

export const getRoleColor = (role: RoleType): string => {
  const colors: Record<RoleType, string> = {
    [RoleType.SUPER_ADMIN]: 'from-red-500 to-red-600',
    [RoleType.DEPT_ADMIN]: 'from-purple-500 to-purple-600',
    [RoleType.SUBORDINATE]: 'from-blue-500 to-blue-600',
    [RoleType.REQUESTER]: 'from-green-500 to-green-600'
  };
  return colors[role] || 'from-gray-500 to-gray-600';
};

export const getRoleBadgeColor = (role: RoleType): string => {
  const colors: Record<RoleType, string> = {
    [RoleType.SUPER_ADMIN]: 'bg-red-100 text-red-700 border-red-200',
    [RoleType.DEPT_ADMIN]: 'bg-purple-100 text-purple-700 border-purple-200',
    [RoleType.SUBORDINATE]: 'bg-blue-100 text-blue-700 border-blue-200',
    [RoleType.REQUESTER]: 'bg-green-100 text-green-700 border-green-200'
  };
  return colors[role] || 'bg-gray-100 text-gray-700 border-gray-200';
};

export const getPermissionsList = (permissions: Permissions): string[] => {
  return Object.entries(permissions)
    .filter(([_, value]) => value === true)
    .map(([key]) => formatPermissionName(key));
};

export const formatPermissionName = (permission: string): string => {
  return permission
    .replace(/^can/, '')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .toLowerCase()
    .replace(/^\w/, c => c.toUpperCase());
};

export const canPerformAction = (
  permissions: Permissions | null,
  requiredPermission: keyof Permissions
): boolean => {
  if (!permissions) return false;
  return permissions[requiredPermission] === true;
};

export const hasAnyRole = (userRole: RoleType | null, ...roles: RoleType[]): boolean => {
  if (!userRole) return false;
  return roles.includes(userRole);
};

export const isSuperAdmin = (userRole: RoleType | null): boolean => {
  return userRole === RoleType.SUPER_ADMIN;
};

export const isDeptAdmin = (userRole: RoleType | null): boolean => {
  return userRole === RoleType.DEPT_ADMIN || userRole === RoleType.SUPER_ADMIN;
};

export const isSubordinate = (userRole: RoleType | null): boolean => {
  return userRole === RoleType.SUBORDINATE || isDeptAdmin(userRole);
};
