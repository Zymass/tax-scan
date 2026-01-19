import React, { useState } from 'react';
import { STATUS_TYPES, TAX_REGIMES, REGIONS } from '../../utils/tax-constants';

interface Step1Props {
  onNext: (data: any) => void;
  initialData?: any;
}

const Step1BasicInfo: React.FC<Step1Props> = ({ onNext, initialData }) => {
  const [formData, setFormData] = useState({
    status_type: initialData?.status_type || 'ИП',
    tax_regime: initialData?.tax_regime || 'УСН 6%',
    revenue_2025: initialData?.revenue_2025 || 0,
    expenses_2025: initialData?.expenses_2025 || 0,
    region_code: initialData?.region_code || '01',
    npd_rate: initialData?.npd_rate || 4 // Ставка НПД: 4% или 6%
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.revenue_2025 <= 0) {
      newErrors.revenue_2025 = 'Выручка должна быть > 0';
    }

    // Проверка ограничения для самозанятого (НПД) - не более 2.4 млн в год
    if (formData.status_type === 'Самозанятый' && formData.revenue_2025 > 2400000) {
      newErrors.revenue_2025 = 'Для самозанятого выручка не может превышать 2 400 000 руб. в год';
    }

    // Проверка ограничения для патента - не более 2.4 млн в год
    if (formData.tax_regime === 'Патент' && formData.revenue_2025 > 2400000) {
      newErrors.revenue_2025 = 'Для патента выручка не может превышать 2 400 000 руб. в год';
    }

    if (formData.revenue_2025 > 450000000) {
      newErrors.revenue_2025 = 'Выручка не может быть > 450M (УСН недоступна)';
    }

    if (formData.revenue_2025 > 20000000) {
      setErrors({
        ...newErrors,
        warning: '⚠️ При выручке > 20M вы обязаны платить НДС с 01.01.2026'
      });
    } else {
      setErrors(newErrors);
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onNext(formData);
    }
  };

  const regimesForStatus = TAX_REGIMES.filter((regime) => {
    if (formData.status_type === 'Самозанятый') {
      return regime.value === 'НПД';
    }
    return true;
  });

  return (
    <form onSubmit={handleSubmit} className="form-step">
      <h2>Шаг 1: Базовая информация</h2>

      <div className="form-group">
        <label>Статус:</label>
        <select
          value={formData.status_type}
          onChange={(e) => handleChange('status_type', e.target.value)}
        >
          {STATUS_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Текущая система налогообложения:</label>
        <select
          value={formData.tax_regime}
          onChange={(e) => handleChange('tax_regime', e.target.value)}
        >
          {regimesForStatus.map((regime) => (
            <option key={regime.value} value={regime.value}>
              {regime.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Выручка за 2025 год (руб.):*</label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={formData.revenue_2025 === 0 ? '' : formData.revenue_2025}
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
              handleChange('revenue_2025', 0);
            } else {
              const numValue = parseInt(value, 10);
              if (!isNaN(numValue) && numValue >= 0) {
                handleChange('revenue_2025', numValue);
              }
            }
          }}
          onBlur={(e) => {
            // При потере фокуса нормализуем значение
            const value = e.target.value.replace(/[^\d]/g, '');
            if (value === '') {
              handleChange('revenue_2025', 0);
            } else {
              const cleanedValue = value.replace(/^0+/, '') || '0';
              const numValue = parseInt(cleanedValue, 10);
              if (!isNaN(numValue) && numValue >= 0) {
                handleChange('revenue_2025', numValue);
              }
            }
          }}
          placeholder="1500000"
        />
        {formData.status_type === 'Самозанятый' && (
          <p className="info-text" style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            ⓘ Для самозанятого максимальная выручка составляет 2 400 000 руб. в год
          </p>
        )}
        {formData.tax_regime === 'Патент' && (
          <p className="info-text" style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            ⓘ Для патента максимальная выручка составляет 2 400 000 руб. в год
          </p>
        )}
        {errors.revenue_2025 && <p className="error">{errors.revenue_2025}</p>}
        {errors.warning && <p className="warning">{errors.warning}</p>}
      </div>

      <div className="form-group">
        <label>Расходы за 2025 год (руб.):</label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={formData.expenses_2025 === 0 ? '' : formData.expenses_2025}
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
              handleChange('expenses_2025', 0);
            } else {
              const numValue = parseInt(value, 10);
              if (!isNaN(numValue) && numValue >= 0) {
                handleChange('expenses_2025', numValue);
              }
            }
          }}
          onBlur={(e) => {
            // При потере фокуса нормализуем значение
            const value = e.target.value.replace(/[^\d]/g, '');
            if (value === '') {
              handleChange('expenses_2025', 0);
            } else {
              const cleanedValue = value.replace(/^0+/, '') || '0';
              const numValue = parseInt(cleanedValue, 10);
              if (!isNaN(numValue) && numValue >= 0) {
                handleChange('expenses_2025', numValue);
              }
            }
          }}
          placeholder="500000"
        />
      </div>

      {formData.tax_regime === 'Патент' && (
        <div className="form-group">
          <label>Регион:</label>
          <select
            value={formData.region_code}
            onChange={(e) => handleChange('region_code', e.target.value)}
          >
            {REGIONS.map((region) => (
              <option key={region.code} value={region.code}>
                {region.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {formData.tax_regime === 'НПД' && (
        <div className="form-group">
          <label>Ставка НПД:</label>
          <select
            value={formData.npd_rate}
            onChange={(e) => handleChange('npd_rate', parseInt(e.target.value))}
          >
            <option value="4">4%</option>
            <option value="6">6%</option>
          </select>
          <p className="info-text" style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            ⓘ Выберите ставку НПД в зависимости от типа деятельности
          </p>
        </div>
      )}

      <div className="form-buttons">
        <button type="submit" className="btn-primary">
          Далее →
        </button>
      </div>
    </form>
  );
};

export default Step1BasicInfo;
