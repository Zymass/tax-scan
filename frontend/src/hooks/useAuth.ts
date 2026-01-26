import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../services/api';
import { User } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Проверяем токен при загрузке и получаем информацию о пользователе
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await apiClient.getMe();
          setUser(response.data);
        } catch (error) {
          // Токен невалидный, очищаем
          localStorage.removeItem('token');
          setUser(null);
        }
      }
    };
    loadUser();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await apiClient.login(email, password);
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      setError(null);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string, phone?: string) => {
    setLoading(true);
    try {
      const response = await apiClient.register(email, password, name, phone);
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      setError(null);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.logout();
      localStorage.removeItem('token');
      // Очищаем сохраненное состояние расчета при выходе
      localStorage.removeItem('current_calculation_id');
      localStorage.removeItem('current_step');
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      // Очищаем localStorage даже при ошибке
      localStorage.removeItem('token');
      localStorage.removeItem('current_calculation_id');
      localStorage.removeItem('current_step');
      setUser(null);
    }
  }, []);

  return {
    user,
    loading,
    error,
    login,
    register,
    logout
  };
};
