import React, { useState } from 'react';
import { CalculationData, ActionPlan } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { apiClient } from '../../services/api';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'comparison' | 'scenarios' | 'actions'>('overview');
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);

  React.useEffect(() => {
    loadActionPlans();
  }, []);

  const loadActionPlans = async () => {
    try {
      const response = await apiClient.getActionPlan(calculationId);
      setActionPlans(response.data);
    } catch (error) {
      console.error('Error loading action plans:', error);
    }
  };

  const handleExportPdf = async () => {
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

  const handleSendEmail = async () => {
    const email = prompt('Введите email:');
    if (!email) {
      return;
    }

    // Простая валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Пожалуйста, введите корректный email адрес');
      return;
    }

    setLoadingEmail(true);
    try {
      await apiClient.sendEmail(calculationId, email);
      alert('Email успешно отправлен!');
    } catch (error: any) {
      console.error('Error sending email:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Неизвестная ошибка';
      alert(`Ошибка при отправке email: ${errorMessage}`);
    } finally {
      setLoadingEmail(false);
    }
  };

  return (
    <div className="step5-results">
      <div className="results-header">
        <h2>📊 Ваша налоговая нагрузка</h2>
        <div className="action-buttons">
          <button onClick={handleExportPdf} disabled={loadingPdf} className="btn-secondary">
            {loadingPdf ? '⏳ Генерация...' : '📥 Скачать PDF'}
          </button>
          <button onClick={handleSendEmail} disabled={loadingEmail} className="btn-secondary">
            {loadingEmail ? '⏳ Отправка...' : '📧 Отправить на email'}
          </button>
          <button className="btn-secondary">🗓️ Добавить в календарь</button>
        </div>
      </div>

      <div className="summary-cards">
        <div className="card">
          <div className="label">2025 год (факт)</div>
          <div className="value">{formatCurrency(data.tax_2025.total)}</div>
          <div className="subtext">{data.revenue_2025 > 0 ? ((data.tax_2025.total / data.revenue_2025) * 100).toFixed(1) : '0'}% от выручки</div>
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
        </div>
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
          </div>
        )}

        {activeTab === 'comparison' && (
          <RegimeComparison regimes={data.regime_comparison} />
        )}

        {activeTab === 'scenarios' && (
          <Scenarios calculationId={calculationId} />
        )}

        {activeTab === 'actions' && (
          <ActionPlanComponent actions={actionPlans} calculationId={calculationId} />
        )}
      </div>
    </div>
  );
};

export default Step5Results;
