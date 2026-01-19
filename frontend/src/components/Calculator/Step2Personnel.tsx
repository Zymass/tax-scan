import React, { useState } from 'react';

interface Step2Props {
  onNext: (data: any) => void;
  onPrevious: () => void;
  initialData?: any;
  step1Data?: any; // Данные из Step1 для проверки статуса
}

const Step2Personnel: React.FC<Step2Props> = ({ onNext, onPrevious, initialData, step1Data }) => {
  const [formData, setFormData] = useState({
    count_employees: initialData?.count_employees || 0,
    fot_year: initialData?.fot_year || 0,
    contribution_rate: initialData?.contribution_rate || 30
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isNpdRegime = step1Data?.status_type === 'Самозанятый' || step1Data?.tax_regime === 'НПД';

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    // Очищаем ошибку при изменении
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Проверка для НПД: нельзя иметь сотрудников
    if (isNpdRegime && formData.count_employees > 0) {
      newErrors.count_employees = 'Для режима НПД (самозанятый) нельзя иметь сотрудников';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onNext(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-step">
      <h2>Шаг 2: Персонал и взносы</h2>

      <div className="form-group">
        <label>Количество сотрудников:</label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={formData.count_employees === 0 ? '' : formData.count_employees}
          onChange={(e) => {
            let value = e.target.value;
            
            // Убираем все нецифровые символы
            value = value.replace(/[^\d]/g, '');
            
            // Убираем ведущие нули, но оставляем один ноль если значение равно "0"
            if (value.length > 1 && value[0] === '0') {
              value = value.replace(/^0+/, '');
            }
            
            // Если пусто, устанавливаем 0
            if (value === '') {
              handleChange('count_employees', 0);
            } else {
              const numValue = parseInt(value, 10);
              if (!isNaN(numValue) && numValue >= 0) {
                handleChange('count_employees', numValue);
              }
            }
          }}
          onBlur={(e) => {
            // При потере фокуса нормализуем значение
            const value = e.target.value.replace(/[^\d]/g, '');
            if (value === '') {
              handleChange('count_employees', 0);
            } else {
              const cleanedValue = value.replace(/^0+/, '') || '0';
              const numValue = parseInt(cleanedValue, 10);
              if (!isNaN(numValue) && numValue >= 0) {
                handleChange('count_employees', numValue);
              }
            }
          }}
          disabled={isNpdRegime}
        />
        {isNpdRegime && (
          <p className="info-text" style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            ⓘ Для режима НПД (самозанятый) нельзя иметь сотрудников
          </p>
        )}
        {errors.count_employees && <p className="error">{errors.count_employees}</p>}
      </div>

      <div className="form-group">
        <label>ФОТ за год (руб.):</label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={formData.fot_year === 0 ? '' : formData.fot_year}
          onChange={(e) => {
            let value = e.target.value;
            
            // Убираем все нецифровые символы
            value = value.replace(/[^\d]/g, '');
            
            // Убираем ведущие нули, но оставляем один ноль если значение равно "0"
            if (value.length > 1 && value[0] === '0') {
              value = value.replace(/^0+/, '');
            }
            
            // Если пусто, устанавливаем 0
            if (value === '') {
              handleChange('fot_year', 0);
            } else {
              const numValue = parseInt(value, 10);
              if (!isNaN(numValue) && numValue >= 0) {
                handleChange('fot_year', numValue);
              }
            }
          }}
          onBlur={(e) => {
            // При потере фокуса нормализуем значение
            const value = e.target.value.replace(/[^\d]/g, '');
            if (value === '') {
              handleChange('fot_year', 0);
            } else {
              const cleanedValue = value.replace(/^0+/, '') || '0';
              const numValue = parseInt(cleanedValue, 10);
              if (!isNaN(numValue) && numValue >= 0) {
                handleChange('fot_year', numValue);
              }
            }
          }}
        />
      </div>

      <div className="form-group">
        <label>Ставка взносов (%):</label>
        <select
          value={formData.contribution_rate}
          onChange={(e) => handleChange('contribution_rate', parseInt(e.target.value))}
        >
          <option value="15">15%</option>
          <option value="30">30%</option>
        </select>
      </div>

      <div className="form-buttons">
        <button type="button" onClick={onPrevious} className="btn-secondary">
          ← Назад
        </button>
        <button type="submit" className="btn-primary">
          Далее →
        </button>
      </div>
    </form>
  );
};

export default Step2Personnel;
