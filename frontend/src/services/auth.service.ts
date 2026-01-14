import api from './api';

export interface User {
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
  roleType: string;
  language: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  expiresAt: string;
}

class AuthService {
  async getCurrentUser(): Promise<User> {
    const response = await api.get('/api/auth/me');
    return response.data.data;
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await api.post('/api/auth/refresh', { refreshToken });
    return response.data.data;
  }

  async logout(refreshToken: string): Promise<void> {
    await api.post('/api/auth/logout', { refreshToken });
  }

  async logoutAll(): Promise<void> {
    await api.post('/api/auth/logout-all');
  }

  async getActiveSessions(): Promise<Session[]> {
    const response = await api.get('/api/auth/sessions');
    return response.data.data;
  }

  getGoogleAuthUrl(): string {
    return `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/google`;
  }
}

export default new AuthService();
