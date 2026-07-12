import { useAuthStore } from '../store/authStore.js';
import { ROLES } from '../constants/roles.js';

export const useAuth = () => {
  const { user, isAuthenticated, accessToken, logout } = useAuthStore();

  return {
    user,
    isAuthenticated,
    accessToken,
    logout,
    isAdmin: user?.role === ROLES.SUPER_ADMIN,
    isMentor: user?.role === ROLES.TECHNICAL_MENTOR,
    isStudent: user?.role === ROLES.STUDENT,
    role: user?.role,
    roles: user?.roles ?? (user?.role ? [user.role] : []),
  };
};
