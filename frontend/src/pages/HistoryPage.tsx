import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';
import { Calculation } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import Header from '../components/Common/Header';
import ProtectedRoute from '../components/Common/ProtectedRoute';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import './HistoryPage.css';

const HistoryPage: React.FC = () => {
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadCalculations();
  }, []);

  const loadCalculations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getCalculations(50, 0);
      setCalculations(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка загрузки истории');
    } finally {
      setLoading(false);
    }
  };

  const handleViewResults = (id: string) => {
    navigate(`/results/${id}`);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Удалить этот расчет?')) return;

    try {
      await apiClient.deleteCalculation(id);
      setCalculations(calculations.filter(calc => calc.id !== id));
    } catch (err: any) {
      alert('Ошибка при удалении: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="page-container">
          <Header />
          <div className="page-content">
            <LoadingSpinner />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="page-container">
        <Header />
        <div className="page-content">
          <div className="history-page">
            <div className="history-header">
              <h1>История расчетов</h1>
              <button onClick={() => navigate('/calculator')} className="btn-primary">
                Новый расчет
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {calculations.length === 0 ? (
              <div className="empty-state">
                <p>У вас пока нет сохраненных расчетов</p>
                <button onClick={() => navigate('/calculator')} className="btn-primary">
                  Создать первый расчет
                </button>
              </div>
            ) : (
              <div className="calculations-list">
                {calculations.map((calc) => (
                  <div
                    key={calc.id}
                    className="calculation-card"
                    onClick={() => handleViewResults(calc.id)}
                  >
                    <div className="card-header">
                      <div className="card-title">
                        <h3>{calc.status_type} - {calc.tax_regime}</h3>
                        <span className={`status-badge status-${calc.status}`}>
                          {calc.status === 'completed' ? 'Завершен' : 
                           calc.status === 'in_progress' ? 'В процессе' : 'Архив'}
                        </span>
                      </div>
                      <button
                        className="btn-icon"
                        onClick={(e) => handleDelete(calc.id, e)}
                        title="Удалить"
                      >
                        🗑️
                      </button>
                    </div>
                    
                    <div className="card-body">
                      <div className="card-row">
                        <span className="label">Выручка 2025:</span>
                        <span className="value">{formatCurrency(calc.revenue_2025)}</span>
                      </div>
                      <div className="card-row">
                        <span className="label">Налог 2025:</span>
                        <span className="value">{formatCurrency(calc.total_tax_2025)}</span>
                      </div>
                      <div className="card-row">
                        <span className="label">Налог 2026:</span>
                        <span className="value highlight">{formatCurrency(calc.total_tax_2026)}</span>
                      </div>
                      {calc.recommended_regime && (
                        <div className="card-row">
                          <span className="label">Рекомендация:</span>
                          <span className="value">{calc.recommended_regime}</span>
                        </div>
                      )}
                      {calc.recommended_savings > 0 && (
                        <div className="card-row savings">
                          <span className="label">Экономия:</span>
                          <span className="value">{formatCurrency(calc.recommended_savings)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="card-footer">
                      <span className="date">Создан: {formatDate(calc.created_at)}</span>
                      {calc.updated_at !== calc.created_at && (
                        <span className="date">Обновлен: {formatDate(calc.updated_at)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default HistoryPage;
