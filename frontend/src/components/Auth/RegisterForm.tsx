import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Auth.css';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(email, password, name, phone || undefined);
      onSuccess?.();
      navigate('/');
    } catch (err) {
      // Error handled by useAuth hook
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Регистрация</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Имя:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              placeholder="Иван Иванов"
            />
          </div>

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
              minLength={8}
              placeholder="Минимум 8 символов"
            />
          </div>

          <div className="form-group">
            <label>Телефон (необязательно):</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 (999) 123-45-67"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>

          {onSwitchToLogin && (
            <p className="auth-switch">
              Уже есть аккаунт?{' '}
              <button type="button" onClick={onSwitchToLogin} className="link-button">
                Войти
              </button>
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
