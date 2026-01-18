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
        <h1>Налоговый калькулятор 2026</h1>
        {user && (
          <div className="header-user">
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
