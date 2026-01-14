import api from './api';
import { UserPermissions, Department } from '../types/permissions';

export const permissionsService = {
  async getMyPermissions(): Promise<UserPermissions> {
    const response = await api.get('/permissions/me');
    return response.data.data;
  },

  async getMyDepartments(): Promise<Department[]> {
    const response = await api.get('/permissions/me/departments');
    return response.data.data;
  },

  async getUserPermissions(userId: string): Promise<UserPermissions> {
    const response = await api.get(`/permissions/users/${userId}`);
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
    const response = await api.get(`/permissions/departments/${departmentId}/access`);
    return response.data.data;
  }
};

export default permissionsService;
