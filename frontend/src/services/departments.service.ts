import api from './api';

export interface Department {
  id: string;
  name: string;
  prefix: string;
  description?: string;
  isDefaultForRequesters: boolean;
  requireRating?: boolean;
  requireDeliverable?: boolean;
  maxDeliverableRejections?: number;
  isActive: boolean;
  createdById?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    users: number;
    ticketAccess: number;
  };
}

export interface CreateDepartmentData {
  name: string;
  prefix: string;
  description?: string;
  isDefaultForRequesters?: boolean;
  requireRating?: boolean;
  requireDeliverable?: boolean;
  maxDeliverableRejections?: number;
}

export interface UpdateDepartmentData {
  name?: string;
  prefix?: string;
  description?: string;
  isDefaultForRequesters?: boolean;
  requireRating?: boolean;
  requireDeliverable?: boolean;
  maxDeliverableRejections?: number;
}

export interface DepartmentFilters {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface DepartmentUser {
  id: string;
  departmentId: string;
  userId: string;
  role: 'ADMIN' | 'MEMBER';
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    roleType: string;
    profilePicture?: string;
  };
}

export const departmentsService = {
  async getAllDepartments(filters: DepartmentFilters = {}) {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));

    const response = await api.get(`/api/departments?${params.toString()}`);
    return response.data;
  },

  async getDepartmentById(id: string) {
    const response = await api.get(`/api/departments/${id}`);
    return response.data;
  },

  async getMyAdminDepartments(): Promise<{ success: boolean; data: Department[] }> {
    const response = await api.get('/api/departments/my-admin-departments');
    return response.data;
  },

  async createDepartment(data: CreateDepartmentData) {
    const response = await api.post('/api/departments', data);
    return response.data;
  },

  async updateDepartment(id: string, data: UpdateDepartmentData) {
    const response = await api.put(`/api/departments/${id}`, data);
    return response.data;
  },

  async deleteDepartment(id: string) {
    const response = await api.delete(`/api/departments/${id}`);
    return response.data;
  },

  async assignUserToDepartment(departmentId: string, userId: string, role: 'ADMIN' | 'MEMBER') {
    const response = await api.post(`/api/departments/${departmentId}/users`, {
      userId,
      role
    });
    return response.data;
  },

  async removeUserFromDepartment(departmentId: string, userId: string) {
    const response = await api.delete(`/api/departments/${departmentId}/users/${userId}`);
    return response.data;
  },

  async getDepartmentUsers(departmentId: string) {
    const response = await api.get(`/api/departments/${departmentId}/users`);
    return response.data;
  },

  async getAccessibleDepartments() {
    const response = await api.get('/api/departments/accessible');
    return response.data.data;
  },

  async getUsersWithAccessToDepartment(departmentId: string) {
    const response = await api.get(`/api/departments/${departmentId}/users-with-access`);
    return response.data.data;
  },

  async grantUserAccessToDepartment(departmentId: string, userId: string, role: 'ADMIN' | 'MEMBER' = 'MEMBER') {
    const response = await api.post(`/api/departments/${departmentId}/grant-access`, {
      userId,
      role
    });
    return response.data;
  },

  async revokeUserAccessFromDepartment(departmentId: string, userId: string) {
    const response = await api.delete(`/api/departments/${departmentId}/revoke-access/${userId}`);
    return response.data;
  },

  async setDepartmentAsDefault(departmentId: string, isDefault: boolean) {
    const response = await api.put(`/api/departments/${departmentId}/set-default`, {
      isDefault
    });
    return response.data;
  }
};
