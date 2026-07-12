import { createContext, useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore.js';
import { authService } from '../services/auth.service.js';
import { queryClient } from '../lib/queryClient.js';
import api from '../api/axios.js';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { isAuthenticated, setAccessToken, logout } = useAuthStore();
  const [ready, setReady] = useState(!isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Re-hydrate the access token from the httpOnly refresh cookie, then
    // fetch fresh user data. If either fails the session is truly expired.
    api.post('/auth/refresh-token')
      .then(({ data }) => {
        setAccessToken(data.data.accessToken);
        return authService.getMe();
      })
      .catch(() => { logout(); queryClient.clear(); })
      .finally(() => setReady(true));
  }, []);

  if (!ready) return null;

  return <AuthContext.Provider value={{}}>{children}</AuthContext.Provider>;
};
