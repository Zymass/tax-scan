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
    region_code: initialData?.region_code || '01'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.revenue_2025 <= 0) {
      newErrors.revenue_2025 = 'Выручка должна быть > 0';
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
          type="number"
          value={formData.revenue_2025}
          onChange={(e) => handleChange('revenue_2025', parseInt(e.target.value) || 0)}
          placeholder="1500000"
        />
        {errors.revenue_2025 && <p className="error">{errors.revenue_2025}</p>}
        {errors.warning && <p className="warning">{errors.warning}</p>}
      </div>

      <div className="form-group">
        <label>Расходы за 2025 год (руб.):</label>
        <input
          type="number"
          value={formData.expenses_2025}
          onChange={(e) => handleChange('expenses_2025', parseInt(e.target.value) || 0)}
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

      <div className="form-buttons">
        <button type="submit" className="btn-primary">
          Далее →
        </button>
      </div>
    </form>
  );
};

export default Step1BasicInfo;
