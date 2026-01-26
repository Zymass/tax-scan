import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LoginForm from '../components/Auth/LoginForm';
import RegisterForm from '../components/Auth/RegisterForm';
import Header from '../components/Common/Header';

const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/calculator';

  const handleLoginSuccess = () => {
    navigate(redirect);
  };

  const handleRegisterSuccess = () => {
    navigate(redirect);
  };

  return (
    <div className="page-container">
      <Header />
      <div className="page-content">
        {isLogin ? (
          <LoginForm 
            onSuccess={handleLoginSuccess}
            onSwitchToRegister={() => setIsLogin(false)}
          />
        ) : (
          <RegisterForm 
            onSuccess={handleRegisterSuccess}
            onSwitchToLogin={() => setIsLogin(true)}
          />
        )}
      </div>
    </div>
  );
};

export default LoginPage;
