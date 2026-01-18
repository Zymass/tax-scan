import { TaxCalculatorService } from '../tax-calculator.service';
import { TaxCalculationError } from '../../utils/tax-rules';

describe('TaxCalculatorService', () => {
  let service: TaxCalculatorService;

  beforeEach(() => {
    service = new TaxCalculatorService();
  });

  describe('calculate', () => {
    it('should calculate taxes for ИП with УСН 6%', () => {
      const input = {
        status_type: 'ИП',
        tax_regime: 'УСН 6%',
        revenue_2025: 1000000,
        expenses_2025: 0,
        count_employees: 0,
        fot_year: 0,
        applies_nds: false,
        nds_rate: 0,
        incoming_nds: 0
      };

      const result = service.calculate(input);

      expect(result.status_type).toBe('ИП');
      expect(result.revenue_2025).toBe(1000000);
      expect(result.tax_2025.main_tax).toBe(60000);
      expect(result.tax_2026.main_tax).toBe(60000);
      expect(result.regime_comparison.length).toBeGreaterThan(0);
      expect(result.recommended_regime).toBeDefined();
    });

    it('should calculate taxes for ИП with УСН 15%', () => {
      const input = {
        status_type: 'ИП',
        tax_regime: 'УСН 15%',
        revenue_2025: 10000000,
        expenses_2025: 7000000,
        count_employees: 5,
        fot_year: 3000000,
        applies_nds: false,
        nds_rate: 0,
        incoming_nds: 0
      };

      const result = service.calculate(input);

      expect(result.tax_2025.main_tax).toBe(450000); // (10M - 7M) * 0.15
      expect(result.tax_2025.contributions).toBe(450000); // 3M * 0.15
      // Выручка 10M не превышает порог 20M, поэтому ставка остается 15% в 2026
      expect(result.tax_2026.contributions).toBe(450000); // 3M * 0.15
    });

    it('should calculate НДС correctly', () => {
      const input = {
        status_type: 'ИП',
        tax_regime: 'УСН 6%',
        revenue_2025: 25000000, // > 20M, должен применяться НДС
        expenses_2025: 0,
        count_employees: 0,
        fot_year: 0,
        applies_nds: true,
        nds_rate: 5,
        incoming_nds: 500000
      };

      const result = service.calculate(input);

      expect(result.tax_2026.nds_tax).toBeGreaterThan(0);
    });

    it('should throw error for invalid status_type', () => {
      const input = {
        status_type: 'INVALID',
        tax_regime: 'УСН 6%',
        revenue_2025: 1000000,
        count_employees: 0,
        applies_nds: false
      };

      expect(() => service.calculate(input)).toThrow(TaxCalculationError);
      expect(() => service.calculate(input)).toThrow('Недопустимый статус');
    });

    it('should throw error when applies_nds is true but nds_rate is missing', () => {
      const input = {
        status_type: 'ИП',
        tax_regime: 'УСН 6%',
        revenue_2025: 25000000,
        count_employees: 0,
        applies_nds: true,
        nds_rate: undefined
      };

      expect(() => service.calculate(input)).toThrow(TaxCalculationError);
      expect(() => service.calculate(input)).toThrow('необходимо указать ставку НДС');
    });

    it('should calculate different contribution rates for 2025 and 2026', () => {
      const input = {
        status_type: 'ИП',
        tax_regime: 'УСН 6%',
        revenue_2025: 25000000, // > 20M
        expenses_2025: 0,
        count_employees: 5,
        fot_year: 5000000,
        applies_nds: false,
        nds_rate: 0,
        incoming_nds: 0
      };

      const result = service.calculate(input);

      // В 2025 ставка 15%
      expect(result.tax_2025.contributions).toBe(750000); // 5M * 0.15
      
      // В 2026 ставка 30% (выручка > 20M и есть сотрудники)
      // ФОТ 5M превышает порог 1465000, добавляется 1%: 5M * 0.30 + (5M - 1465000) * 0.01
      const expected2026 = 5000000 * 0.30 + (5000000 - 1465000) * 0.01;
      expect(result.tax_2026.contributions).toBe(expected2026);
    });

    it('should recommend best regime', () => {
      const input = {
        status_type: 'ИП',
        tax_regime: 'УСН 6%',
        revenue_2025: 10000000,
        expenses_2025: 8000000, // Большие расходы - УСН 15% должен быть выгоднее
        count_employees: 0,
        fot_year: 0,
        applies_nds: false,
        nds_rate: 0,
        incoming_nds: 0
      };

      const result = service.calculate(input);

      expect(result.regime_comparison.some(r => r.recommended)).toBe(true);
      expect(result.recommended_savings).toBeGreaterThanOrEqual(0);
    });

    it('should handle НПД for самозанятый', () => {
      const input = {
        status_type: 'Самозанятый',
        tax_regime: 'НПД',
        revenue_2025: 2000000,
        expenses_2025: 0,
        count_employees: 0,
        fot_year: 0,
        applies_nds: false,
        nds_rate: 0,
        incoming_nds: 0
      };

      const result = service.calculate(input);

      expect(result.tax_2025.main_tax).toBe(80000); // 2M * 0.04
      expect(result.tax_2025.contributions).toBe(0);
    });

    it('should throw error for НПД with employees', () => {
      const input = {
        status_type: 'Самозанятый',
        tax_regime: 'НПД',
        revenue_2025: 2000000,
        expenses_2025: 0,
        count_employees: 5,
        fot_year: 1000000,
        applies_nds: false,
        nds_rate: 0,
        incoming_nds: 0
      };

      expect(() => service.calculate(input)).toThrow(TaxCalculationError);
      expect(() => service.calculate(input)).toThrow('НПД недоступен при наличии сотрудников');
    });

    it('should throw error for negative revenue', () => {
      const input = {
        status_type: 'ИП',
        tax_regime: 'УСН 6%',
        revenue_2025: -1000,
        count_employees: 0,
        applies_nds: false
      };

      expect(() => service.calculate(input)).toThrow(TaxCalculationError);
      expect(() => service.calculate(input)).toThrow('Выручка не может быть отрицательной');
    });
  });
});
