import { useState } from 'react';
import { authService } from '../services/authService';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    authService.isAuthenticated()
  );

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
  };

  const authenticate = () => {
    setIsAuthenticated(true);
  };

  return {
    isAuthenticated,
    authenticate,
    logout,
  };
}
