import api from './api';
import { UserPermissions, Department } from '../types/permissions';

export const permissionsService = {
  _permissionsCache: null as UserPermissions | null,
  _permissionsCacheTime: 0,
  _permissionsPromise: null as Promise<UserPermissions> | null,
  _CACHE_DURATION: 30000, // 30 segundos

  async getMyPermissions(): Promise<UserPermissions> {
    const now = Date.now();
    
    // Si hay datos en cache y son recientes, retornarlos inmediatamente
    if (this._permissionsCache && (now - this._permissionsCacheTime) < this._CACHE_DURATION) {
      return this._permissionsCache;
    }
    
    // Si hay una petición en curso, reutilizarla
    if (this._permissionsPromise) {
      return this._permissionsPromise;
    }
    
    // Crear nueva petición
    this._permissionsPromise = api.get('/api/permissions/me')
      .then(response => {
        this._permissionsCache = response.data.data;
        this._permissionsCacheTime = Date.now();
        this._permissionsPromise = null;
        return response.data.data;
      })
      .catch(error => {
        this._permissionsPromise = null;
        throw error;
      });
    
    return this._permissionsPromise;
  },

  clearPermissionsCache(): void {
    this._permissionsCache = null;
    this._permissionsCacheTime = 0;
    this._permissionsPromise = null;
  },

  async getMyDepartments(): Promise<Department[]> {
    const response = await api.get('/api/permissions/me/departments');
    return response.data.data;
  },

  async getUserPermissions(userId: string): Promise<UserPermissions> {
    const response = await api.get(`/api/permissions/users/${userId}`);
    return response.data.data;
  },

  async checkDepartmentAccess(departmentId: string): Promise<{
    hasAccess: boolean;
    role?: string;
    department?: {
      id: string;
      name: string;
    };
    reason?: string;
  }> {
    const response = await api.get(`/api/permissions/departments/${departmentId}/access`);
    return response.data.data;
  }
};

export default permissionsService;
