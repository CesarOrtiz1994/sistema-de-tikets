import { create } from 'zustand';
import authService, { User } from '../services/auth.service';
import { usePermissionsStore } from '../hooks/usePermissions';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isLoadingUser: boolean;
  
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  loadUser: () => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  clearError: () => void;
}

let loadUserPromise: Promise<void> | null = null;
let isLoadingUserFlag = false;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isLoadingUser: false,
  error: null,

  setUser: (user) => {
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    });
  },

  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  },

  loadUser: async (): Promise<void> => {
    // Verificación síncrona ANTES de crear la promesa
    if (isLoadingUserFlag) {
      await loadUserPromise;
      return;
    }
    
    if (loadUserPromise) {
      await loadUserPromise;
      return;
    }

    const accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken) {
      set({ user: null, isAuthenticated: false, isLoading: false, isLoadingUser: false });
      return;
    }

    // Activar flag INMEDIATAMENTE antes de crear la promesa
    isLoadingUserFlag = true;
    set({ isLoading: true, isLoadingUser: true, error: null });

    loadUserPromise = (async () => {
      try {
        const user = await authService.getCurrentUser();
        set({ user, isAuthenticated: true, isLoading: false, isLoadingUser: false });
      } catch (error: any) {
        console.error('Error loading user:', error);
        console.error('Detalles:', error.response?.data || error.message);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, isAuthenticated: false, isLoading: false, isLoadingUser: false, error: 'Failed to load user' });
      } finally {
        isLoadingUserFlag = false;
        loadUserPromise = null;
      }
    })();

    await loadUserPromise;
  },

  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      authService.clearUserCache();
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ user: null, isAuthenticated: false, isLoading: false, isLoadingUser: false });
      usePermissionsStore.getState().clearPermissions();
    }
  },

  logoutAll: async () => {
    try {
      await authService.logoutAll();
    } catch (error) {
      console.error('Error al cerrar todas las sesiones:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      loadUserPromise = null;
      set({ user: null, isAuthenticated: false, isLoading: false, isLoadingUser: false });
      usePermissionsStore.getState().clearPermissions();
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
