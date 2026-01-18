import React from 'react';
import { TaxBreakdown as TaxBreakdownType } from '../../types';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import './TaxBreakdown.css';

interface TaxBreakdownProps {
  year: number;
  data: TaxBreakdownType;
  total: number;
  prevYear?: TaxBreakdownType;
}

const TaxBreakdown: React.FC<TaxBreakdownProps> = ({ year, data, total, prevYear }) => {
  const delta = prevYear ? data.total - prevYear.total : 0;
  const deltaPercent = prevYear ? ((delta / prevYear.total) * 100).toFixed(1) : '0';

  return (
    <div className="tax-breakdown">
      <div className="year-header">
        <h3>{year} год</h3>
        <div className={`delta ${delta > 0 ? 'increase' : 'decrease'}`}>
          <span>{delta > 0 ? '+' : ''}{formatCurrency(delta)}</span>
          <span>({deltaPercent}%)</span>
        </div>
      </div>

      <table className="breakdown-table">
        <tbody>
          <tr>
            <td>Основной налог:</td>
            <td>{formatCurrency(data.main_tax)}</td>
            <td className="percent">{formatPercentage(data.main_tax, total)}</td>
          </tr>
          <tr>
            <td>НДС:</td>
            <td>{formatCurrency(data.nds_tax)}</td>
            <td className="percent">{formatPercentage(data.nds_tax, total)}</td>
          </tr>
          <tr>
            <td>Взносы:</td>
            <td>{formatCurrency(data.contributions)}</td>
            <td className="percent">{formatPercentage(data.contributions, total)}</td>
          </tr>
          <tr className="total">
            <td><strong>ИТОГО:</strong></td>
            <td><strong>{formatCurrency(data.total)}</strong></td>
            <td className="percent"><strong>100%</strong></td>
          </tr>
        </tbody>
      </table>

      <div className="progress-bars">
        <div className="bar-item">
          <div className="label">Основной налог</div>
          <div className="bar">
            <div
              className="fill"
              style={{ width: `${(data.main_tax / total) * 100}%` }}
            />
          </div>
        </div>
        <div className="bar-item">
          <div className="label">НДС</div>
          <div className="bar">
            <div className="fill" style={{ width: `${(data.nds_tax / total) * 100}%` }} />
          </div>
        </div>
        <div className="bar-item">
          <div className="label">Взносы</div>
          <div className="bar">
            <div
              className="fill"
              style={{ width: `${(data.contributions / total) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxBreakdown;
