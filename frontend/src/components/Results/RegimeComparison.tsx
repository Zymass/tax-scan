import React from 'react';
import { RegimeOption } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface RegimeComparisonProps {
  regimes: RegimeOption[];
}

const RegimeComparison: React.FC<RegimeComparisonProps> = ({ regimes }) => {
  return (
    <div className="regime-comparison">
      <h3>Сравнение режимов налогообложения</h3>
      <table>
        <thead>
          <tr>
            <th>Режим</th>
            <th>Налоговая нагрузка</th>
            <th>Доступность</th>
            <th>Рекомендация</th>
          </tr>
        </thead>
        <tbody>
          {regimes.map((regime) => (
            <tr key={regime.regime} className={regime.recommended ? 'recommended' : ''}>
              <td>{regime.regime}</td>
              <td>{formatCurrency(regime.total_tax)}</td>
              <td>{regime.available ? '✓ Доступен' : '✗ Недоступен'}</td>
              <td>{regime.recommended ? '⭐ Рекомендуется' : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RegimeComparison;
