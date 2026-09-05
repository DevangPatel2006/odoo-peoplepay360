import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useApp } from '../store';
import { AccessDenied } from './AccessDenied';

export const RoleGuard = ({ allowedRoles }) => {
  const { user, token } = useApp();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    const userRoles = Array.isArray(user.roles) && user.roles.length > 0
      ? user.roles
      : (user.role ? [user.role] : []);
    const isAdmin = userRoles.some((r) => String(r).toLowerCase() === 'admin');
    const hasPermission = isAdmin || userRoles.some((r) => allowedRoles.includes(r));
    if (!hasPermission) {
      return <AccessDenied requiredRole={allowedRoles.join(' / ')} />;
    }
  }

  return <Outlet />;
};

export default RoleGuard;
