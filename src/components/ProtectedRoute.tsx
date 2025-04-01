import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'audit' | 'sales')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = ['admin'] 
}) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  if (!allowedRoles.includes(role as any)) {
    // Redirect based on role
    if (role === 'audit') {
      return <Navigate to="/risk-report" />;
    }
    if (role === 'sales') {
      return <Navigate to="/sales-commission" />;
    }
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};