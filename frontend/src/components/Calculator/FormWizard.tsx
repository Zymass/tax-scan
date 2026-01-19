import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCalculation } from '../../hooks/useCalculation';
import Step1BasicInfo from './Step1BasicInfo';
import Step2Personnel from './Step2Personnel';
import Step3NDS from './Step3NDS';
import Step4TaxRegime from './Step4TaxRegime';
import Step5Results from '../Results/Step5Results';
import './FormWizard.css';

const FormWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [calculationId, setCalculationId] = useState<string | null>(null);
  const [savedResults, setSavedResults] = useState<any>(null);
  const [isLoadingState, setIsLoadingState] = useState(true);
  const [formData, setFormData] = useState({
    step1: {},
    step2: {},
    step3: {},
    step4: {}
  });

  const { create, saveStep, calculate, results, loading, error, loadCalculation } = useCalculation();

  // Сохраняем calculationId в localStorage
  useEffect(() => {
    if (calculationId) {
      localStorage.setItem('current_calculation_id', calculationId);
    }
  }, [calculationId]);

  // Сохраняем currentStep в localStorage
  useEffect(() => {
    if (calculationId) {
      localStorage.setItem('current_step', currentStep.toString());
    }
  }, [currentStep, calculationId]);

  // Сохраняем results в локальное состояние, чтобы они не пропадали
  useEffect(() => {
    if (results) {
      setSavedResults(results);
    }
  }, [results]);

  // Восстанавливаем состояние при загрузке
  useEffect(() => {
    const restoreState = async () => {
      const savedCalculationId = localStorage.getItem('current_calculation_id');
      
      if (savedCalculationId) {
        try {
          const calc = await loadCalculation(savedCalculationId);
          if (calc) {
            setCalculationId(savedCalculationId);
            const savedStep = localStorage.getItem('current_step');
            if (savedStep) {
              setCurrentStep(parseInt(savedStep, 10));
            } else {
              setCurrentStep(calc.current_step || 1);
            }

            // Загружаем данные шагов
            if (calc.steps) {
              const stepData: any = {};
              calc.steps.forEach((step: any) => {
                try {
                  const data = typeof step.data === 'string' ? JSON.parse(step.data) : step.data;
                  stepData[`step${step.step_number}`] = data;
                } catch (e) {
                  // Ignore parse errors
                }
              });
              setFormData(prev => ({ ...prev, ...stepData }));
            }

            // Если расчет завершен, загружаем результаты
            if (calc.status === 'completed') {
              try {
                const calcResults = await calculate(savedCalculationId);
                if (calcResults) {
                  setSavedResults(calcResults);
                }
              } catch (e) {
                console.error('Error loading results:', e);
              }
            }
          } else {
            // Расчет не найден, очищаем localStorage
            localStorage.removeItem('current_calculation_id');
            localStorage.removeItem('current_step');
          }
        } catch (err) {
          console.error('Error restoring state:', err);
          localStorage.removeItem('current_calculation_id');
          localStorage.removeItem('current_step');
        }
      }
      setIsLoadingState(false);
    };

    restoreState();
  }, [loadCalculation, calculate]);

  const handleInit = async () => {
    const id = await create();
    if (id) {
      setCalculationId(id);
      setCurrentStep(1);
      setFormData({ step1: {}, step2: {}, step3: {}, step4: {} });
      setSavedResults(null);
      localStorage.setItem('current_calculation_id', id);
      localStorage.setItem('current_step', '1');
    }
  };

  const handleNewCalculation = async () => {
    // Очищаем старое состояние
    localStorage.removeItem('current_calculation_id');
    localStorage.removeItem('current_step');
    setCalculationId(null);
    setCurrentStep(1);
    setFormData({ step1: {}, step2: {}, step3: {}, step4: {} });
    setSavedResults(null);
    // Создаем новый расчет
    await handleInit();
  };

  const handleNext = async (stepData: any) => {
    setFormData({
      ...formData,
      [`step${currentStep}`]: stepData
    });

    if (calculationId && currentStep < 4) {
      await saveStep(calculationId, currentStep, stepData);
    }

    if (currentStep === 4 && calculationId) {
      await saveStep(calculationId, currentStep, stepData);
      await calculate(calculationId);
      setCurrentStep(5);
    } else if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Показываем загрузку при восстановлении состояния
  if (isLoadingState) {
    return (
      <div className="wizard-init">
        <div className="loading-container">
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!calculationId) {
    return (
      <div className="wizard-init">
        <div className="wizard-header-actions">
          <button onClick={() => navigate('/profile')} className="btn-secondary btn-small">
            👤 Личный кабинет
          </button>
        </div>
        <h1>Калькулятор налоговой нагрузки 2026</h1>
        <p>Узнайте, сколько вы будете платить налогов в 2026 году</p>
        <button onClick={handleInit} disabled={loading} className="btn-primary">
          {loading ? 'Загрузка...' : 'Начать расчет'}
        </button>
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="form-wizard">
      <div className="wizard-header-actions">
        <button onClick={handleNewCalculation} className="btn-secondary btn-small">
          ➕ Новый расчет
        </button>
        <button onClick={() => navigate('/profile')} className="btn-secondary btn-small">
          👤 Личный кабинет
        </button>
      </div>
      <div className="wizard-progress">
        {[1, 2, 3, 4, 5].map((step) => (
          <div
            key={step}
            className={`progress-step ${step === currentStep ? 'active' : ''} ${
              step < currentStep ? 'completed' : ''
            }`}
          >
            <span>{step}</span>
          </div>
        ))}
      </div>

      <div className="wizard-content">
        {currentStep === 1 && <Step1BasicInfo onNext={handleNext} initialData={formData.step1} />}
        {currentStep === 2 && <Step2Personnel onNext={handleNext} onPrevious={handlePrevious} initialData={formData.step2} />}
        {currentStep === 3 && <Step3NDS onNext={handleNext} onPrevious={handlePrevious} initialData={formData.step3} />}
        {currentStep === 4 && <Step4TaxRegime onNext={handleNext} onPrevious={handlePrevious} initialData={formData.step4} />}
        {currentStep === 5 && (
          loading ? (
            <div className="loading-container">
              <p>Расчет результатов...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <h2>Ошибка при расчете</h2>
              <p>{error}</p>
              <button onClick={() => calculationId && calculate(calculationId)} className="btn-primary">
                Попробовать снова
              </button>
            </div>
          ) : (results || savedResults) ? (
            <Step5Results data={results || savedResults} calculationId={calculationId!} />
          ) : (
            <div className="no-results">
              <p>Результаты не найдены. Попробуйте пересчитать.</p>
              <button onClick={() => calculationId && calculate(calculationId)} className="btn-primary">
                Рассчитать
              </button>
            </div>
          )
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default FormWizard;
