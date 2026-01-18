import React, { useState } from 'react';
import { TAX_REGIMES } from '../../utils/tax-constants';

interface Step4Props {
  onNext: (data: any) => void;
  onPrevious: () => void;
  initialData?: any;
}

const Step4TaxRegime: React.FC<Step4Props> = ({ onNext, onPrevious, initialData }) => {
  const [formData, setFormData] = useState({
    regime: initialData?.regime || 'УСН 6%',
    expenses: initialData?.expenses || 0
  });

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="form-step">
      <h2>Шаг 4: Режим налогообложения</h2>

      <div className="form-group">
        <label>Режим налогообложения:</label>
        <select
          value={formData.regime}
          onChange={(e) => handleChange('regime', e.target.value)}
        >
          {TAX_REGIMES.map((regime) => (
            <option key={regime.value} value={regime.value}>
              {regime.label}
            </option>
          ))}
        </select>
      </div>

      {formData.regime === 'УСН 15%' && (
        <div className="form-group">
          <label>Расходы (руб.):</label>
          <input
            type="number"
            value={formData.expenses}
            onChange={(e) => handleChange('expenses', parseInt(e.target.value) || 0)}
            min="0"
          />
        </div>
      )}

      <div className="form-buttons">
        <button type="button" onClick={onPrevious} className="btn-secondary">
          ← Назад
        </button>
        <button type="submit" className="btn-primary">
          Рассчитать →
        </button>
      </div>
    </form>
  );
};

export default Step4TaxRegime;
