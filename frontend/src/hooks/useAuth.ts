import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    setUser,
    setTokens,
    loadUser,
    logout,
    logoutAll,
    clearError,
  } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    setUser,
    setTokens,
    loadUser,
    logout,
    logoutAll,
    clearError,
  };
};
