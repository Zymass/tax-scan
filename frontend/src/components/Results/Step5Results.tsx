import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalculationData, ActionPlan } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { apiClient } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import TaxBreakdown from './TaxBreakdown';
import RegimeComparison from './RegimeComparison';
import Scenarios from './Scenarios';
import ActionPlanComponent from './ActionPlan';
import './Step5Results.css';

interface Step5Props {
  data: CalculationData;
  calculationId: string;
}

const Step5Results: React.FC<Step5Props> = ({ data, calculationId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAuthenticated = !!user;
  const [activeTab, setActiveTab] = useState<'overview' | 'comparison' | 'scenarios' | 'actions'>('overview');
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);
  const [loadingPdf, setLoadingPdf] = useState(false);
  // const [loadingEmail, setLoadingEmail] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      loadActionPlans();
    }
  }, [isAuthenticated]);

  const loadActionPlans = async () => {
    try {
      const response = await apiClient.getActionPlan(calculationId);
      setActionPlans(response.data);
    } catch (error) {
      console.error('Error loading action plans:', error);
    }
  };

  const handleExportPdf = async () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/results/' + calculationId);
      return;
    }
    
    setLoadingPdf(true);
    try {
      const response = await apiClient.exportPdf(calculationId);
      // Создаем blob из ответа
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tax-calculation-${calculationId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error exporting PDF:', error);
      alert(`Ошибка при экспорте PDF: ${error.response?.data?.error || error.message || 'Неизвестная ошибка'}`);
    } finally {
      setLoadingPdf(false);
    }
  };

  // const handleSendEmail = async () => {
  //   const email = prompt('Введите email:');
  //   if (!email) {
  //     return;
  //   }

  //   // Простая валидация email
  //   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  //   if (!emailRegex.test(email)) {
  //     alert('Пожалуйста, введите корректный email адрес');
  //     return;
  //   }

  //   setLoadingEmail(true);
  //   try {
  //     await apiClient.sendEmail(calculationId, email);
  //     alert('Email успешно отправлен!');
  //   } catch (error: any) {
  //     console.error('Error sending email:', error);
  //     const errorMessage = error.response?.data?.error || error.message || 'Неизвестная ошибка';
  //     alert(`Ошибка при отправке email: ${errorMessage}`);
  //   } finally {
  //     setLoadingEmail(false);
  //   }
  // };

  return (
    <div className="step5-results">
      {!isAuthenticated && (
        <div className="auth-prompt" style={{
          background: 'linear-gradient(135deg, #0284C7 0%, #0ea5e9 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>🔒 Получите полный доступ</h3>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
              Войдите или зарегистрируйтесь, чтобы увидеть прогнозы за 2027-2028 годы, получить полный отчет, 
              сохранить расчеты, экспортировать PDF и использовать все функции калькулятора.
            </p>
          </div>
          <button
            onClick={() => navigate('/login?redirect=/results/' + calculationId)}
            style={{
              background: 'white',
              color: '#0284C7',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              marginLeft: '20px',
              whiteSpace: 'nowrap'
            }}
          >
            Войти / Зарегистрироваться
          </button>
        </div>
      )}

      <div className="results-header">
        <h2>📊 Ваша налоговая нагрузка</h2>
        {isAuthenticated && (
          <div className="action-buttons">
            <button onClick={handleExportPdf} disabled={loadingPdf} className="btn-secondary">
              {loadingPdf ? '⏳ Генерация...' : '📥 Скачать PDF'}
            </button>
            <button className="btn-secondary">🗓️ Добавить в календарь</button>
          </div>
        )}
      </div>

      <div className="summary-cards">
        <div className="card">
          <div className="label">2025 год (факт)</div>
          <div className="value">{formatCurrency(data.tax_2025.total)}</div>
          <div className="subtext">{data.revenue_2025 > 0 ? ((data.tax_2025.total / data.revenue_2025) * 100).toFixed(1) : '0'}% от выручки</div>
          {data.tax_2025.nds_tax > 0 && (
            <div className="nds-info">НДС: {formatCurrency(data.tax_2025.nds_tax)}</div>
          )}
        </div>
        <div className="card highlight">
          <div className="label">2026 год (прогноз)</div>
          <div className="value">{formatCurrency(data.tax_2026.total)}</div>
          <div className="subtext">{data.revenue_2025 > 0 ? ((data.tax_2026.total / data.revenue_2025) * 100).toFixed(1) : '0'}% от выручки</div>
          {data.tax_2025.total > 0 && (
            <div className="change">
              +{formatCurrency(data.tax_2026.total - data.tax_2025.total)} ({(((data.tax_2026.total - data.tax_2025.total) / data.tax_2025.total) * 100).toFixed(0)}%)
            </div>
          )}
          {data.tax_2026.nds_tax > 0 && (
            <div className="nds-info">НДС: {formatCurrency(data.tax_2026.nds_tax)} (порог: 20M)</div>
          )}
        </div>
        {isAuthenticated && (
          <>
            <div className="card">
              <div className="label">2027 год (прогноз)</div>
              <div className="value">{formatCurrency(data.tax_2027.total)}</div>
              <div className="subtext">{data.revenue_2025 > 0 ? ((data.tax_2027.total / data.revenue_2025) * 100).toFixed(1) : '0'}% от выручки</div>
              {data.tax_2026.total > 0 && (
                <div className="change">
                  {data.tax_2027.total - data.tax_2026.total >= 0 ? '+' : ''}
                  {formatCurrency(data.tax_2027.total - data.tax_2026.total)} ({(((data.tax_2027.total - data.tax_2026.total) / data.tax_2026.total) * 100).toFixed(0)}%)
                </div>
              )}
              {data.tax_2027.nds_tax > 0 && (
                <div className="nds-info">НДС: {formatCurrency(data.tax_2027.nds_tax)} (порог: 15M)</div>
              )}
            </div>
            <div className="card">
              <div className="label">2028 год (прогноз)</div>
              <div className="value">{formatCurrency(data.tax_2028.total)}</div>
              <div className="subtext">{data.revenue_2025 > 0 ? ((data.tax_2028.total / data.revenue_2025) * 100).toFixed(1) : '0'}% от выручки</div>
              {data.tax_2027.total > 0 && (
                <div className="change">
                  {data.tax_2028.total - data.tax_2027.total >= 0 ? '+' : ''}
                  {formatCurrency(data.tax_2028.total - data.tax_2027.total)} ({(((data.tax_2028.total - data.tax_2027.total) / data.tax_2027.total) * 100).toFixed(0)}%)
                </div>
              )}
              {data.tax_2028.nds_tax > 0 && (
                <div className="nds-info">НДС: {formatCurrency(data.tax_2028.nds_tax)} (порог: 10M)</div>
              )}
            </div>
          </>
        )}
        <div className="card">
          <div className="label">Рекомендуемый режим</div>
          <div className="value">{data.recommended_regime}</div>
          <div className="subtext">Экономия: {formatCurrency(data.recommended_savings)}</div>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Обзор
        </button>
        <button
          className={`tab ${activeTab === 'comparison' ? 'active' : ''}`}
          onClick={() => setActiveTab('comparison')}
        >
          Сравнение режимов
        </button>
        {isAuthenticated && (
          <>
            <button
              className={`tab ${activeTab === 'scenarios' ? 'active' : ''}`}
              onClick={() => setActiveTab('scenarios')}
            >
              Сценарии
            </button>
            <button
              className={`tab ${activeTab === 'actions' ? 'active' : ''}`}
              onClick={() => setActiveTab('actions')}
            >
              План действий
            </button>
          </>
        )}
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview">
            <TaxBreakdown year={2025} data={data.tax_2025} total={data.tax_2025.total} />
            <TaxBreakdown
              year={2026}
              data={data.tax_2026}
              total={data.tax_2026.total}
              prevYear={data.tax_2025}
            />
            {isAuthenticated ? (
              <>
                <TaxBreakdown
                  year={2027}
                  data={data.tax_2027}
                  total={data.tax_2027.total}
                  prevYear={data.tax_2026}
                />
                <TaxBreakdown
                  year={2028}
                  data={data.tax_2028}
                  total={data.tax_2028.total}
                  prevYear={data.tax_2027}
                />
              </>
            ) : (
              <div style={{ 
                marginTop: '30px',
                padding: '30px',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '2px dashed #e5e7eb',
                textAlign: 'center'
              }}>
                <h3 style={{ color: '#6b7280', marginBottom: '12px', fontSize: '18px' }}>
                  🔒 Прогнозы за 2027 и 2028 годы
                </h3>
                <p style={{ color: '#9ca3af', marginBottom: '20px', fontSize: '14px' }}>
                  Войдите или зарегистрируйтесь, чтобы увидеть детальные прогнозы налоговой нагрузки на 2027 и 2028 годы
                </p>
                <button
                  onClick={() => navigate('/login?redirect=/results/' + calculationId)}
                  className="btn-primary"
                  style={{ marginTop: '10px' }}
                >
                  Войти / Зарегистрироваться
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'comparison' && (
          <>
            <RegimeComparison regimes={data.regime_comparison} />
            {!isAuthenticated && (
              <div style={{ 
                marginTop: '20px',
                padding: '16px',
                background: '#fef3c7',
                border: '1px solid #fbbf24',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <p style={{ margin: '0 0 12px 0', color: '#92400e', fontSize: '14px' }}>
                  💡 <strong>Войдите</strong> для сохранения расчетов и доступа к расширенным функциям
                </p>
                <button
                  onClick={() => navigate('/login?redirect=/results/' + calculationId)}
                  style={{
                    background: '#0284C7',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Войти / Зарегистрироваться
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === 'scenarios' && isAuthenticated && (
          <Scenarios calculationId={calculationId} />
        )}

        {activeTab === 'scenarios' && !isAuthenticated && (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px',
            background: '#f9fafb',
            borderRadius: '8px',
            border: '2px dashed #e5e7eb'
          }}>
            <h3 style={{ color: '#6b7280', marginBottom: '12px' }}>🔒 Доступно только для авторизованных пользователей</h3>
            <p style={{ color: '#9ca3af', marginBottom: '20px' }}>
              Войдите или зарегистрируйтесь, чтобы создавать и сравнивать сценарии "что если"
            </p>
            <button
              onClick={() => navigate('/login?redirect=/results/' + calculationId)}
              className="btn-primary"
            >
              Войти / Зарегистрироваться
            </button>
          </div>
        )}

        {activeTab === 'actions' && isAuthenticated && (
          <ActionPlanComponent actions={actionPlans} calculationId={calculationId} />
        )}

        {activeTab === 'actions' && !isAuthenticated && (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px',
            background: '#f9fafb',
            borderRadius: '8px',
            border: '2px dashed #e5e7eb'
          }}>
            <h3 style={{ color: '#6b7280', marginBottom: '12px' }}>🔒 Доступно только для авторизованных пользователей</h3>
            <p style={{ color: '#9ca3af', marginBottom: '20px' }}>
              Войдите или зарегистрируйтесь, чтобы получить персональный план действий по налоговому планированию
            </p>
            <button
              onClick={() => navigate('/login?redirect=/results/' + calculationId)}
              className="btn-primary"
            >
              Войти / Зарегистрироваться
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Step5Results;
