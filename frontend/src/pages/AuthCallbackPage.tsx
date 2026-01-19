import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const AuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      // Redirect to login with error
      navigate(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    if (token) {
      // Save token and redirect to calculator
      localStorage.setItem('token', token);
      navigate('/calculator');
    } else {
      // No token, redirect to login
      navigate('/login?error=Authentication failed');
    }
  }, [searchParams, navigate]);

  return (
    <div className="page-container">
      <div className="page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <LoadingSpinner message="Завершение входа..." />
      </div>
    </div>
  );
};

export default AuthCallbackPage;
