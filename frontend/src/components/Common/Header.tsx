import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Header.css';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <h1 
          onClick={() => navigate('/calculator')}
          style={{ cursor: 'pointer' }}
        >
          Налоговый калькулятор 2026
        </h1>
        {user && (
          <div className="header-user">
            <button
              onClick={() => navigate('/calculator')}
              className="btn-link"
            >
              Калькулятор
            </button>
            <button
              onClick={() => navigate('/history')}
              className="btn-link"
            >
              История
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="btn-link"
            >
              Личный кабинет
            </button>
            <span>{user.name}</span>
            <button onClick={handleLogout} className="btn-secondary btn-small">
              Выйти
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
