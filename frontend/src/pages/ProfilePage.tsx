import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import { User } from '../types';
import Header from '../components/Common/Header';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import './ProfilePage.css';

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
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

  const calculationsCount = profile.calculations_count ?? 0;

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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
