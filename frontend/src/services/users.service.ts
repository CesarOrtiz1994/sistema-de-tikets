import api from './api';

export interface User {
  id: string;
  email: string;
  name: string;
  roleType: string;
  isActive: boolean;
  language: string;
  profilePicture?: string;
  googleId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateUserData {
  email: string;
  name: string;
  roleType?: string;
  language?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  language?: string;
  profilePicture?: string;
}

export interface UsersListResponse {
  users: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UserStatsResponse {
  total: number;
  active: number;
  inactive: number;
  deleted: number;
  byRole: {
    SUPER_ADMIN?: number;
    DEPT_ADMIN?: number;
    SUBORDINATE?: number;
    REQUESTER?: number;
  };
}

export const usersService = {
  async listUsers(params?: {
    search?: string;
    roleType?: string;
    isActive?: boolean;
    includeDeleted?: boolean;
    page?: number;
    limit?: number;
  }): Promise<UsersListResponse> {
    const response = await api.get('/api/users', { params });
    return response.data.data;
  },

  async getUserById(userId: string): Promise<User> {
    const response = await api.get(`/api/users/${userId}`);
    return response.data.data;
  },

  async createUser(data: CreateUserData): Promise<User> {
    const response = await api.post('/api/users', data);
    return response.data.data;
  },

  async updateUser(userId: string, data: UpdateUserData): Promise<User> {
    const response = await api.put(`/api/users/${userId}`, data);
    return response.data.data;
  },

  async deleteUser(userId: string): Promise<User> {
    const response = await api.delete(`/api/users/${userId}`);
    return response.data.data;
  },

  async restoreUser(userId: string): Promise<User> {
    const response = await api.put(`/api/users/${userId}/restore`);
    return response.data.data;
  },

  async changeUserRole(userId: string, roleType: string): Promise<User> {
    const response = await api.put(`/api/users/${userId}/role`, { roleType });
    return response.data.data;
  },

  async toggleUserActivation(userId: string, isActive: boolean): Promise<User> {
    const response = await api.put(`/api/users/${userId}/activate`, { isActive });
    return response.data.data;
  },

  async getUserStats(): Promise<UserStatsResponse> {
    const response = await api.get('/api/users/stats');
    return response.data.data;
  }
};

export default usersService;
