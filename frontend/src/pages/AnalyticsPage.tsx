import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/api';
import Header from '../components/Common/Header';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import './AnalyticsPage.css';

interface AnalyticsStats {
  totalUsers: number;
  newUsers: number;
  totalCalculations: number;
  newCalculations: number;
  completedCalculations: number;
  calculationsByPeriod: { date: string; count: number }[];
  usersByPeriod: { date: string; count: number }[];
  calculationsByStatus: { status: string; count: number }[];
  calculationsByRegime: { regime: string; count: number }[];
}

const AnalyticsPage: React.FC = () => {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async (start?: string, end?: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getAnalytics(start, end);
      setStats(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка загрузки аналитики');
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilter = () => {
    loadStats(startDate || undefined, endDate || undefined);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
  };

  if (loading && !stats) {
    return (
      <div className="page-container">
        <Header />
        <div className="page-content">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="page-container">
        <Header />
        <div className="page-content">
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Header />
      <div className="page-content">
        <div className="analytics-page">
          <div className="analytics-header">
            <h1>📊 Аналитика</h1>
            <div className="date-filter">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Начало периода"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="Конец периода"
              />
              <button onClick={handleDateFilter} className="btn-primary">
                Применить фильтр
              </button>
              <button 
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  loadStats();
                }} 
                className="btn-secondary"
              >
                Сбросить
              </button>
            </div>
          </div>

          {stats && (
            <>
              {/* Основные метрики */}
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-value">{stats.totalUsers}</div>
                  <div className="metric-label">Всего пользователей</div>
                </div>
                <div className="metric-card">
                  <div className="metric-value">{stats.newUsers}</div>
                  <div className="metric-label">Новых пользователей</div>
                  <div className="metric-period">за выбранный период</div>
                </div>
                <div className="metric-card">
                  <div className="metric-value">{stats.totalCalculations}</div>
                  <div className="metric-label">Всего расчетов</div>
                </div>
                <div className="metric-card">
                  <div className="metric-value">{stats.newCalculations}</div>
                  <div className="metric-label">Новых расчетов</div>
                  <div className="metric-period">за выбранный период</div>
                </div>
                <div className="metric-card">
                  <div className="metric-value">{stats.completedCalculations}</div>
                  <div className="metric-label">Завершенных расчетов</div>
                </div>
                <div className="metric-card">
                  <div className="metric-value">
                    {stats.totalUsers > 0 
                      ? ((stats.totalCalculations / stats.totalUsers).toFixed(1))
                      : '0'}
                  </div>
                  <div className="metric-label">Расчетов на пользователя</div>
                </div>
              </div>

              {/* График расчетов по дням */}
              <div className="chart-section">
                <h2>Расчеты по дням</h2>
                <div className="chart-container">
                  <div className="bar-chart">
                    {stats.calculationsByPeriod.map((item, index) => {
                      const maxCount = Math.max(...stats.calculationsByPeriod.map(i => i.count), 1);
                      const height = (item.count / maxCount) * 100;
                      return (
                        <div key={index} className="bar-item">
                          <div 
                            className="bar" 
                            style={{ height: `${height}%` }}
                            title={`${item.count} расчетов`}
                          />
                          <div className="bar-label">{formatDate(item.date)}</div>
                          {item.count > 0 && (
                            <div className="bar-value">{item.count}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* График пользователей по дням */}
              <div className="chart-section">
                <h2>Новые пользователи по дням</h2>
                <div className="chart-container">
                  <div className="bar-chart">
                    {stats.usersByPeriod.map((item, index) => {
                      const maxCount = Math.max(...stats.usersByPeriod.map(i => i.count), 1);
                      const height = (item.count / maxCount) * 100;
                      return (
                        <div key={index} className="bar-item">
                          <div 
                            className="bar" 
                            style={{ height: `${height}%` }}
                            title={`${item.count} пользователей`}
                          />
                          <div className="bar-label">{formatDate(item.date)}</div>
                          {item.count > 0 && (
                            <div className="bar-value">{item.count}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Расчеты по статусам */}
              <div className="chart-section">
                <h2>Расчеты по статусам</h2>
                <div className="stats-list">
                  {stats.calculationsByStatus.map((item, index) => (
                    <div key={index} className="stat-item">
                      <span className="stat-name">{item.status === 'completed' ? 'Завершено' : item.status === 'in_progress' ? 'В процессе' : item.status}</span>
                      <span className="stat-count">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Расчеты по налоговым режимам */}
              <div className="chart-section">
                <h2>Расчеты по налоговым режимам</h2>
                <div className="stats-list">
                  {stats.calculationsByRegime.map((item, index) => (
                    <div key={index} className="stat-item">
                      <span className="stat-name">{item.regime}</span>
                      <span className="stat-count">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
