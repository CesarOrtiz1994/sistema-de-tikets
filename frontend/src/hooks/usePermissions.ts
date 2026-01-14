import { create } from 'zustand';
import { UserPermissions, Permissions, Department, RoleType } from '../types/permissions';
import permissionsService from '../services/permissions.service';

interface PermissionsState {
  permissions: Permissions | null;
  departments: Department[] | null;
  userRole: RoleType | null;
  isLoading: boolean;
  error: string | null;
  
  loadPermissions: () => Promise<void>;
  hasPermission: (permission: keyof Permissions) => boolean;
  hasRole: (...roles: RoleType[]) => boolean;
  canAccessDepartment: (departmentId: string) => Promise<boolean>;
  clearPermissions: () => void;
}

export const usePermissionsStore = create<PermissionsState>((set, get) => ({
  permissions: null,
  departments: null,
  userRole: null,
  isLoading: false,
  error: null,

  loadPermissions: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const data: UserPermissions = await permissionsService.getMyPermissions();
      
      set({
        permissions: data.permissions,
        departments: data.departments,
        userRole: data.user.roleType,
        isLoading: false
      });
    } catch (error: any) {
      console.error('Error al cargar permisos:', error);
      set({
        error: error.message || 'Error al cargar permisos',
        isLoading: false
      });
    }
  },

  hasPermission: (permission: keyof Permissions) => {
    const { permissions } = get();
    if (!permissions) return false;
    return permissions[permission] === true;
  },

  hasRole: (...roles: RoleType[]) => {
    const { userRole } = get();
    if (!userRole) return false;
    return roles.includes(userRole);
  },

  canAccessDepartment: async (departmentId: string) => {
    try {
      const result = await permissionsService.checkDepartmentAccess(departmentId);
      return result.hasAccess;
    } catch (error) {
      console.error('Error al verificar acceso al departamento:', error);
      return false;
    }
  },

  clearPermissions: () => {
    set({
      permissions: null,
      departments: null,
      userRole: null,
      error: null
    });
  }
}));

export const usePermissions = () => {
  const store = usePermissionsStore();
  
  return {
    permissions: store.permissions,
    departments: store.departments,
    userRole: store.userRole,
    isLoading: store.isLoading,
    error: store.error,
    loadPermissions: store.loadPermissions,
    hasPermission: store.hasPermission,
    hasRole: store.hasRole,
    canAccessDepartment: store.canAccessDepartment,
    clearPermissions: store.clearPermissions
  };
};
