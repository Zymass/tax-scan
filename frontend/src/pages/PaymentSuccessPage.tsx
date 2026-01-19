import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/auth';
import Header from '../components/Common/Header';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import './PaymentSuccessPage.css';

const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const checkPayment = async () => {
      try {
        // Обновляем профиль пользователя, чтобы получить актуальный лимит
        await authService.getMe();
        setSuccess(true);
      } catch (error) {
        console.error('Error checking payment:', error);
      } finally {
        setLoading(false);
      }
    };

    checkPayment();
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <Header />
        <div className="page-content">
          <LoadingSpinner message="Проверка оплаты..." />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Header />
      <div className="page-content">
        <div className="payment-success-page">
          {success ? (
            <>
              <div className="success-icon">✓</div>
              <h1>Оплата успешно завершена!</h1>
              <p>Ваш лимит расчетов был увеличен. Теперь вы можете создавать новые расчеты.</p>
              <div className="success-actions">
                <button 
                  onClick={() => navigate('/profile')} 
                  className="btn-primary"
                >
                  Перейти в личный кабинет
                </button>
                <button 
                  onClick={() => navigate('/calculator')} 
                  className="btn-secondary"
                >
                  Создать расчет
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="error-icon">✗</div>
              <h1>Ошибка при обработке оплаты</h1>
              <p>Пожалуйста, свяжитесь с поддержкой, если оплата была успешной.</p>
              <button 
                onClick={() => navigate('/profile')} 
                className="btn-primary"
              >
                Вернуться в личный кабинет
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
