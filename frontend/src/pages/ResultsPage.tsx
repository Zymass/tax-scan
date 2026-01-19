import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';
import { CalculationData } from '../types';
import Step5Results from '../components/Results/Step5Results';
import Header from '../components/Common/Header';
import ProtectedRoute from '../components/Common/ProtectedRoute';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const ResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [results, setResults] = useState<CalculationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      navigate('/calculator');
      return;
    }

    const loadResults = async () => {
      try {
        setLoading(true);
        const response = await apiClient.calculateResults(id);
        setResults(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Ошибка загрузки результатов');
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [id, navigate]);

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

  if (error || !results || !id) {
    return (
      <ProtectedRoute>
        <div className="page-container">
          <Header />
          <div className="page-content">
            <div className="error-message">
              {error || 'Результаты не найдены'}
            </div>
            <button onClick={() => navigate('/calculator')} className="btn-primary">
              Вернуться к калькулятору
            </button>
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
          <Step5Results data={results} calculationId={id} />
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ResultsPage;
