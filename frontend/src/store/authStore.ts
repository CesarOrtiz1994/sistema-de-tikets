import { create } from 'zustand';
import authService, { User } from '../services/auth.service';

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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  isLoadingUser: false,

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

  loadUser: async () => {
    if (loadUserPromise) {
      return loadUserPromise;
    }

    if (get().isLoadingUser) {
      return;
    }

    const accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken) {
      set({ user: null, isAuthenticated: false, isLoading: false, isLoadingUser: false });
      loadUserPromise = null;
      return;
    }

    loadUserPromise = (async () => {
      try {
        set({ isLoading: true, isLoadingUser: true, error: null });
        const user = await authService.getCurrentUser();
        set({ user, isAuthenticated: true, isLoading: false, isLoadingUser: false });
      } catch (error) {
        console.error('Error loading user:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, isAuthenticated: false, isLoading: false, isLoadingUser: false, error: 'Failed to load user' });
      } finally {
        loadUserPromise = null;
      }
    })();

    return loadUserPromise;
  },

  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      loadUserPromise = null;
      set({ user: null, isAuthenticated: false, isLoading: false, isLoadingUser: false });
    }
  },

  logoutAll: async () => {
    try {
      await authService.logoutAll();
    } catch (error) {
      console.error('Error during logout all:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      loadUserPromise = null;
      set({ user: null, isAuthenticated: false, isLoading: false, isLoadingUser: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
