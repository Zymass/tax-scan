import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface OptionalProtectedRouteProps {
  children: React.ReactNode;
  showWarning?: boolean;
}

const OptionalProtectedRoute: React.FC<OptionalProtectedRouteProps> = ({ 
  children, 
  showWarning = false 
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      {showWarning && !user && (
        <div style={{
          background: '#fef3c7',
          border: '1px solid #fbbf24',
          padding: '12px 20px',
          margin: '10px 20px',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ color: '#92400e', fontSize: '14px' }}>
            ⚠️ Вы используете калькулятор без авторизации. 
            <strong> Войдите</strong> для сохранения расчетов и доступа к полным отчетам.
          </span>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: '#0284C7',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              marginLeft: '12px'
            }}
          >
            Войти
          </button>
        </div>
      )}
      {children}
    </>
  );
};

export default OptionalProtectedRoute;
