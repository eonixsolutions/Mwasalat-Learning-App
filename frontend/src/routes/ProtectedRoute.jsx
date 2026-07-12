import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { ROLE_DASHBOARD, ROLE_LOGIN } from '../constants/roles.js';

export const ProtectedRoute = ({ allowedRoles, loginPath }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) {
    const redirect = loginPath ?? (allowedRoles?.length === 1 ? ROLE_LOGIN[allowedRoles[0]] : '/login');
    return <Navigate to={redirect} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_DASHBOARD[user.role] || ROLE_LOGIN[user.role] || '/login'} replace />;
  }

  return <Outlet />;
};
