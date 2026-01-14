import { create } from 'zustand';
import { UserPermissions, Permissions, Department, RoleType } from '../types/permissions';
import permissionsService from '../services/permissions.service';

interface PermissionsState {
  permissions: Permissions | null;
  departments: Department[] | null;
  userRole: RoleType | null;
  isLoading: boolean;
  error: string | null;
  hasLoaded: boolean;
  
  loadPermissions: () => Promise<void>;
  hasPermission: (permission: keyof Permissions) => boolean;
  hasRole: (...roles: RoleType[]) => boolean;
  canAccessDepartment: (departmentId: string) => Promise<boolean>;
  clearPermissions: () => void;
}

let loadPermissionsPromise: Promise<void> | null = null;
let isLoadingPermissionsFlag = false;

export const usePermissionsStore = create<PermissionsState>((set, get) => ({
  permissions: null,
  departments: null,
  userRole: null,
  isLoading: false,
  error: null,
  hasLoaded: false,

  loadPermissions: async (): Promise<void> => {
    // Verificación síncrona ANTES de crear la promesa
    if (isLoadingPermissionsFlag) {
      await loadPermissionsPromise;
      return;
    }

    // Si hay una carga en progreso, retornar esa promesa
    if (loadPermissionsPromise) {
      await loadPermissionsPromise;
      return;
    }

    // Si ya se cargaron los permisos, no cargar de nuevo
    if (get().hasLoaded && get().permissions) {
      return;
    }

    // Activar flag INMEDIATAMENTE antes de crear la promesa
    isLoadingPermissionsFlag = true;
    set({ isLoading: true, error: null });

    loadPermissionsPromise = (async () => {
      try {
        set({ isLoading: true, error: null });
        
        const data: UserPermissions = await permissionsService.getMyPermissions();
        
        set({
          permissions: data.permissions,
          departments: data.departments,
          userRole: data.user.roleType,
          isLoading: false,
          hasLoaded: true
        });
      } catch (error: any) {
        // NO BLOQUEAR EL SISTEMA - Continuar sin permisos
        set({
          permissions: null,
          departments: null,
          userRole: null,
          error: error.message || 'Error al cargar permisos',
          isLoading: false,
          hasLoaded: true
        });
      } finally {
        isLoadingPermissionsFlag = false;
        loadPermissionsPromise = null;
      }
    })();

    await loadPermissionsPromise;
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
      error: null,
      hasLoaded: false
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
