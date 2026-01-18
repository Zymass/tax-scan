import React, { useState } from 'react';

interface Step2Props {
  onNext: (data: any) => void;
  onPrevious: () => void;
  initialData?: any;
}

const Step2Personnel: React.FC<Step2Props> = ({ onNext, onPrevious, initialData }) => {
  const [formData, setFormData] = useState({
    count_employees: initialData?.count_employees || 0,
    fot_year: initialData?.fot_year || 0,
    contribution_rate: initialData?.contribution_rate || 30
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
      <h2>Шаг 2: Персонал и взносы</h2>

      <div className="form-group">
        <label>Количество сотрудников:</label>
        <input
          type="number"
          value={formData.count_employees}
          onChange={(e) => handleChange('count_employees', parseInt(e.target.value) || 0)}
          min="0"
        />
      </div>

      <div className="form-group">
        <label>ФОТ за год (руб.):</label>
        <input
          type="number"
          value={formData.fot_year}
          onChange={(e) => handleChange('fot_year', parseInt(e.target.value) || 0)}
          min="0"
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
