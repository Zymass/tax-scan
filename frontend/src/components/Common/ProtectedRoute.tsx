import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { apiClient } from '../../services/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      // Проверяем токен, пытаясь получить список расчетов
      try {
        await apiClient.getCalculations(1, 0);
        setIsAuthenticated(true);
      } catch (error: any) {
        // Если 401 - токен невалидный
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
        }
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return <div className="loading-container">Проверка авторизации...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
