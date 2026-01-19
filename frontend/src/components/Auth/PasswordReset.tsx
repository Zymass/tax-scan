import React, { useState } from 'react';
import { apiClient } from '../../services/api';
import './Auth.css';

interface PasswordResetProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PasswordReset: React.FC<PasswordResetProps> = ({ onSuccess, onCancel }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiClient.passwordReset(email);
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка при отправке запроса');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-form">
          <h2>Проверьте почту</h2>
          <p>Инструкции по сбросу пароля отправлены на {email}</p>
          {onCancel && (
            <button onClick={onCancel} className="btn-secondary">
              Вернуться назад
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Сброс пароля</h2>
        <p>Введите email, и мы отправим инструкции по восстановлению пароля</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Отправка...' : 'Отправить'}
          </button>

          {onCancel && (
            <button type="button" onClick={onCancel} className="btn-secondary">
              Отмена
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default PasswordReset;
