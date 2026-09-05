import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useApp } from '../store';
import { AccessDenied } from './AccessDenied';

export const RoleGuard = ({ allowedRoles }) => {
  const { user, token } = useApp();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && user) {
    const hasPermission = allowedRoles.includes(user.role) || user.role === 'Admin';
    if (!hasPermission) {
      return <AccessDenied requiredRole={allowedRoles.join(' / ')} />;
    }
  }

  return <Outlet />;
};

export default RoleGuard;
