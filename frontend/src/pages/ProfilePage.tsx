import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
// import { paymentService } from '../services/payment'; // Временно отключено
import { User } from '../types';
import Header from '../components/Common/Header';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import './ProfilePage.css';

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [showPaymentModal, setShowPaymentModal] = useState(false); // Временно отключено
  // const [calculationsToBuy, setCalculationsToBuy] = useState(5); // Временно отключено
  // const [paymentLoading, setPaymentLoading] = useState(false); // Временно отключено
  const navigate = useNavigate();

  // const PRICE_PER_CALCULATION = 100; // Цена за расчет в рублях - временно отключено

  useEffect(() => {
    loadProfile();
    
    // Проверяем, вернулись ли с оплаты
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
      // Обновляем профиль после успешной оплаты
      setTimeout(() => {
        loadProfile();
      }, 2000);
    }
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const userProfile = await authService.getMe();
      setProfile(userProfile);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка загрузки профиля');
    } finally {
      setLoading(false);
    }
  };

  // Функция покупки расчетов временно отключена
  // const handleBuyCalculations = async () => {
  //   ...
  // };

  if (loading) {
    return (
      <div className="page-container">
        <Header />
        <div className="page-content">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <Header />
        <div className="page-content">
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const availableCalculations = profile.available_calculations ?? 0;
  const calculationsCount = profile.calculations_count ?? 0;
  const calculationsLimit = profile.calculations_limit ?? 5;

  return (
    <div className="page-container">
      <Header />
      <div className="page-content">
        <div className="profile-page">
          <div className="profile-header">
            <h1>Личный кабинет</h1>
          </div>

          <div className="profile-content">
            <div className="profile-section">
              <h2>Личная информация</h2>
              <div className="profile-info">
                <div className="info-row">
                  <span className="info-label">ФИО / Никнейм:</span>
                  <span className="info-value">{profile.name}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{profile.email}</span>
                </div>
                {profile.phone && (
                  <div className="info-row">
                    <span className="info-label">Телефон:</span>
                    <span className="info-value">{profile.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="profile-section">
              <h2>Доступные расчеты</h2>
              <div className="calculations-stats">
                {/* Карточки "Доступно" и "Лимит" временно скрыты */}
                {/* <div className="stat-card">
                  <div className="stat-value">{availableCalculations}</div>
                  <div className="stat-label">Доступно</div>
                </div> */}
                <div className="stat-card">
                  <div className="stat-value">{calculationsCount}</div>
                  <div className="stat-label">Использовано</div>
                </div>
                {/* <div className="stat-card">
                  <div className="stat-value">{calculationsLimit}</div>
                  <div className="stat-label">Лимит</div>
                </div> */}
              </div>
              
              {/* Прогресс-бар временно скрыт */}
              {/* <div className="progress-bar-container">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${(calculationsCount / calculationsLimit) * 100}%` }}
                  />
                </div>
                <div className="progress-text">
                  {calculationsCount} из {calculationsLimit} расчетов использовано
                </div>
              </div> */}

              <div className="profile-actions">
                <button 
                  onClick={() => navigate('/calculator')} 
                  className="btn-primary"
                >
                  Создать новый расчет
                </button>
                <button 
                  onClick={() => navigate('/history')} 
                  className="btn-secondary"
                >
                  История расчетов
                </button>
                {/* Кнопка оплаты временно скрыта */}
                {/* <button 
                  onClick={() => setShowPaymentModal(true)} 
                  className="btn-primary"
                  style={{ background: '#059669' }}
                >
                  💳 Купить расчеты
                </button> */}
              </div>
            </div>
          </div>
        </div>

        {/* Модальное окно оплаты временно скрыто */}
        {/* {showPaymentModal && (
          <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
            ...
          </div>
        )} */}
      </div>
    </div>
  );
};

export default ProfilePage;
