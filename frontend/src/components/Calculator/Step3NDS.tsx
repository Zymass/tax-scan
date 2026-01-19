import React, { useState } from 'react';
import { NDS_RATES } from '../../utils/tax-constants';

interface Step3Props {
  onNext: (data: any) => void;
  onPrevious: () => void;
  initialData?: any;
}

const Step3NDS: React.FC<Step3Props> = ({ onNext, onPrevious, initialData }) => {
  const [formData, setFormData] = useState({
    applies_nds: initialData?.applies_nds || false,
    nds_rate: initialData?.nds_rate || 22,
    incoming_nds: initialData?.incoming_nds || 0
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
      <h2>Шаг 3: НДС</h2>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={formData.applies_nds}
            onChange={(e) => handleChange('applies_nds', e.target.checked)}
          />
          Применяется НДС
        </label>
      </div>

      {formData.applies_nds && (
        <>
          <div className="form-group">
            <label>Ставка НДС:</label>
            <select
              value={formData.nds_rate}
              onChange={(e) => handleChange('nds_rate', parseInt(e.target.value))}
            >
              {NDS_RATES.map((rate) => (
                <option key={rate.value} value={rate.value}>
                  {rate.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Входящий НДС (руб.):</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={formData.incoming_nds === 0 ? '' : formData.incoming_nds}
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
                  handleChange('incoming_nds', 0);
                } else {
                  const numValue = parseInt(value, 10);
                  if (!isNaN(numValue) && numValue >= 0) {
                    handleChange('incoming_nds', numValue);
                  }
                }
              }}
              onBlur={(e) => {
                // При потере фокуса нормализуем значение
                const value = e.target.value.replace(/[^\d]/g, '');
                if (value === '') {
                  handleChange('incoming_nds', 0);
                } else {
                  const cleanedValue = value.replace(/^0+/, '') || '0';
                  const numValue = parseInt(cleanedValue, 10);
                  if (!isNaN(numValue) && numValue >= 0) {
                    handleChange('incoming_nds', numValue);
                  }
                }
              }}
            />
          </div>
        </>
      )}

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

export default Step3NDS;
