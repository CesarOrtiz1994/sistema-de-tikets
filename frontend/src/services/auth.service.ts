import api from './api';

export interface User {
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
  roleType: string;
  departmentId?: string;
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
  private currentUserCache: User | null = null;
  private currentUserCacheTime = 0;
  private currentUserPromise: Promise<User> | null = null;
  private readonly CACHE_DURATION = 30000; // 30 segundos

  async getCurrentUser(): Promise<User> {
    const now = Date.now();
    
    // Si hay datos en cache y son recientes, retornarlos inmediatamente
    if (this.currentUserCache && (now - this.currentUserCacheTime) < this.CACHE_DURATION) {
      return this.currentUserCache;
    }
    
    // Si hay una petición en curso, reutilizarla
    if (this.currentUserPromise) {
      return this.currentUserPromise;
    }
    
    // Crear nueva petición
    this.currentUserPromise = api.get('/api/auth/me')
      .then(response => {
        this.currentUserCache = response.data.data;
        this.currentUserCacheTime = Date.now();
        this.currentUserPromise = null;
        return response.data.data;
      })
      .catch(error => {
        this.currentUserPromise = null;
        throw error;
      });
    
    return this.currentUserPromise;
  }

  clearUserCache(): void {
    this.currentUserCache = null;
    this.currentUserCacheTime = 0;
    this.currentUserPromise = null;
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
