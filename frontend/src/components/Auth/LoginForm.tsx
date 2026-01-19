import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import PasswordReset from './PasswordReset';
import './Auth.css';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check for error in URL (from OAuth callback)
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setUrlError(decodeURIComponent(errorParam));
      // Clean URL
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      onSuccess?.();
      navigate('/');
    } catch (err) {
      // Error handled by useAuth hook
    }
  };

  const handleGoogleLogin = () => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  if (showPasswordReset) {
    return (
      <PasswordReset
        onSuccess={() => setShowPasswordReset(false)}
        onCancel={() => setShowPasswordReset(false)}
      />
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Вход</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
            />
          </div>

          <div className="form-group">
            <label>Пароль:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          {(error || urlError) && (
            <div className="error-message">{error || urlError}</div>
          )}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Вход...' : 'Войти'}
          </button>

          <div className="auth-divider">
            <span>или</span>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="btn-google"
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: '8px' }}>
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.467-.806 5.96-2.184l-2.908-2.258c-.806.54-1.837.86-3.052.86-2.347 0-4.33-1.585-5.04-3.714H.957v2.332C2.438 15.983 5.482 18 9 18z"
              />
              <path
                fill="#FBBC05"
                d="M3.96 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.55 0 9s.348 2.827.957 4.042l3.003-2.332z"
              />
              <path
                fill="#EA4335"
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.96 7.29C4.67 5.163 6.653 3.58 9 3.58z"
              />
            </svg>
            Войти через Google
          </button>

          <p className="auth-switch">
            <button
              type="button"
              onClick={() => setShowPasswordReset(true)}
              className="link-button"
            >
              Забыли пароль?
            </button>
          </p>

          {onSwitchToRegister && (
            <p className="auth-switch">
              Нет аккаунта?{' '}
              <button type="button" onClick={onSwitchToRegister} className="link-button">
                Зарегистрироваться
              </button>
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
