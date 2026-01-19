import {
  calculateUsnTax,
  calculateNdsTax,
  calculateContributions,
  getNdsRate,
  recommendedRegime,
  calculateTotalTaxForRegime,
  validateRevenue,
  validateExpenses,
  validateEmployees,
  validateFot,
  validateRegime,
  TaxCalculationError,
  TAX_CONSTANTS
} from '../tax-rules';

describe('Tax Rules Calculations', () => {
  describe('calculateUsnTax', () => {
    it('should calculate УСН 6% correctly', () => {
      expect(calculateUsnTax(1000000, 6)).toBe(60000);
      expect(calculateUsnTax(5000000, 6)).toBe(300000);
    });

    it('should calculate УСН 15% correctly', () => {
      expect(calculateUsnTax(1000000, 15, 500000)).toBe(75000);
      expect(calculateUsnTax(1000000, 15, 0)).toBe(150000);
    });

    it('should throw error when expenses exceed revenue', () => {
      expect(() => calculateUsnTax(1000000, 15, 1500000)).toThrow(TaxCalculationError);
      expect(() => calculateUsnTax(1000000, 15, 1500000)).toThrow('Расходы не могут превышать выручку');
    });

    it('should throw error for invalid rate', () => {
      expect(() => calculateUsnTax(1000000, 10)).toThrow(TaxCalculationError);
      expect(() => calculateUsnTax(1000000, 10)).toThrow('Недопустимая ставка УСН');
    });

    it('should throw error for negative revenue', () => {
      expect(() => calculateUsnTax(-1000, 6)).toThrow(TaxCalculationError);
      expect(() => calculateUsnTax(-1000, 6)).toThrow('Выручка не может быть отрицательной');
    });

    it('should throw error for negative expenses', () => {
      expect(() => calculateUsnTax(1000000, 15, -1000)).toThrow(TaxCalculationError);
      expect(() => calculateUsnTax(1000000, 15, -1000)).toThrow('Расходы не могут быть отрицательными');
    });

    it('should throw error when expenses exceed revenue', () => {
      expect(() => calculateUsnTax(1000000, 15, 2000000)).toThrow(TaxCalculationError);
      expect(() => calculateUsnTax(1000000, 15, 2000000)).toThrow('Расходы не могут превышать выручку');
    });
  });

  describe('calculateNdsTax', () => {
    it('should calculate НДС 5% correctly', () => {
      expect(calculateNdsTax(1000000, 5)).toBe(50000);
    });

    it('should calculate НДС 7% correctly', () => {
      expect(calculateNdsTax(1000000, 7)).toBe(70000);
    });

    it('should calculate НДС 22% with incoming НДС', () => {
      expect(calculateNdsTax(1000000, 22, 100000)).toBe(120000);
      expect(calculateNdsTax(1000000, 22, 250000)).toBe(0); // incoming больше начисленного
    });

    it('should return 0 for rate 0 (освобожден)', () => {
      expect(calculateNdsTax(1000000, 0)).toBe(0);
    });

    it('should throw error for invalid rate', () => {
      expect(() => calculateNdsTax(1000000, 10)).toThrow(TaxCalculationError);
      expect(() => calculateNdsTax(1000000, 10)).toThrow('Недопустимая ставка НДС');
    });

    it('should throw error for negative incoming НДС', () => {
      expect(() => calculateNdsTax(1000000, 22, -1000)).toThrow(TaxCalculationError);
      expect(() => calculateNdsTax(1000000, 22, -1000)).toThrow('Входящий НДС не может быть отрицательным');
    });
  });

  describe('calculateContributions', () => {
    it('should return 0 for zero employees', () => {
      expect(calculateContributions(0, 1000000)).toBe(0);
    });

    it('should calculate contributions at 15%', () => {
      expect(calculateContributions(5, 1000000, 15)).toBe(150000);
    });

    it('should calculate contributions at 30%', () => {
      expect(calculateContributions(5, 1000000, 30)).toBe(300000);
    });

    it('should add 1% for FoT exceeding threshold at 30%', () => {
      const fot = 2000000; // превышает порог 1465000
      const base = fot * 0.30;
      const additional = (fot - TAX_CONSTANTS.ADDITIONAL_CONTRIBUTION_THRESHOLD) * 0.01;
      expect(calculateContributions(5, fot, 30)).toBe(base + additional);
    });

    it('should throw error for negative employees', () => {
      expect(() => calculateContributions(-1, 1000000)).toThrow(TaxCalculationError);
      expect(() => calculateContributions(-1, 1000000)).toThrow('Количество сотрудников не может быть отрицательным');
    });

    it('should throw error when employees > 0 but FoT = 0', () => {
      expect(() => calculateContributions(5, 0)).toThrow(TaxCalculationError);
      expect(() => calculateContributions(5, 0)).toThrow('При наличии сотрудников ФОТ должен быть больше нуля');
    });

    it('should throw error for invalid rate', () => {
      expect(() => calculateContributions(5, 1000000, 20)).toThrow(TaxCalculationError);
      expect(() => calculateContributions(5, 1000000, 20)).toThrow('Недопустимая ставка взносов');
    });
  });

  describe('getNdsRate', () => {
    it('should return 0 for revenue <= 20M (освобожден)', () => {
      expect(getNdsRate(15000000, true)).toBe(0);
      expect(getNdsRate(20000000, true)).toBe(0);
    });

    it('should return 5% for revenue 20M-272M', () => {
      expect(getNdsRate(25000000, true)).toBe(5);
      expect(getNdsRate(272000000, true)).toBe(5);
    });

    it('should return 7% for revenue 272M-450M', () => {
      expect(getNdsRate(300000000, true)).toBe(7);
      expect(getNdsRate(449000000, true)).toBe(7);
    });

    it('should return 22% for revenue >= 450M', () => {
      expect(getNdsRate(450000000, true)).toBe(22);
      expect(getNdsRate(500000000, true)).toBe(22);
    });

    it('should return 0 when НДС not applies', () => {
      expect(getNdsRate(100000000, false)).toBe(0);
    });
  });

  describe('recommendedRegime', () => {
    it('should recommend ОСНО for revenue > 450M', () => {
      expect(recommendedRegime(500000000, 0, 0, 0)).toBe('ОСНО');
    });

    it('should recommend УСН 15% when it is cheaper', () => {
      // При больших расходах УСН 15% выгоднее
      expect(recommendedRegime(10000000, 8000000, 0, 0)).toBe('УСН 15%');
    });

    it('should recommend УСН 6% when it is cheaper', () => {
      // При малых расходах УСН 6% выгоднее
      expect(recommendedRegime(10000000, 1000000, 0, 0)).toBe('УСН 6%');
    });
  });

  describe('calculateTotalTaxForRegime', () => {
    it('should calculate УСН 6% correctly', () => {
      const result = calculateTotalTaxForRegime('УСН 6%', 1000000, 0, 0, 0, 0, 0, 30, 'ИП');
      expect(result.main_tax).toBe(60000);
      expect(result.total).toBe(60000);
    });

    it('should calculate УСН 15% correctly', () => {
      const result = calculateTotalTaxForRegime('УСН 15%', 1000000, 500000, 0, 0, 0, 0, 30, 'ИП');
      expect(result.main_tax).toBe(75000);
      expect(result.nds_tax).toBe(0);
      expect(result.total).toBe(75000);
    });

    it('should calculate ОСНО correctly', () => {
      const result = calculateTotalTaxForRegime('ОСНО', 1000000, 0, 0, 0, 22, 0, 30, 'ИП');
      expect(result.main_tax).toBe(130000);
      expect(result.nds_tax).toBe(220000);
      expect(result.total).toBe(350000);
    });

    it('should calculate НПД correctly with 4% rate', () => {
      const result = calculateTotalTaxForRegime('НПД', 1000000, 0, 0, 0, 0, 0, 30, 'Самозанятый', 4);
      expect(result.main_tax).toBe(40000);
      expect(result.nds_tax).toBe(0);
      expect(result.contributions).toBe(0);
      expect(result.total).toBe(40000);
    });

    it('should calculate НПД correctly with 6% rate', () => {
      const result = calculateTotalTaxForRegime('НПД', 1000000, 0, 0, 0, 0, 0, 30, 'Самозанятый', 6);
      expect(result.main_tax).toBe(60000);
      expect(result.nds_tax).toBe(0);
      expect(result.contributions).toBe(0);
      expect(result.total).toBe(60000);
    });

    it('should throw error for НПД with invalid rate', () => {
      expect(() => calculateTotalTaxForRegime('НПД', 1000000, 0, 0, 0, 0, 0, 30, 'Самозанятый', 5))
        .toThrow(TaxCalculationError);
      expect(() => calculateTotalTaxForRegime('НПД', 1000000, 0, 0, 0, 0, 0, 30, 'Самозанятый', 5))
        .toThrow('Ставка НПД должна быть 4% или 6%');
    });

    it('should calculate Патент correctly', () => {
      const result = calculateTotalTaxForRegime('Патент', 1000000, 0, 0, 0, 0, 0, 30, 'ИП', 4, 0.06);
      expect(result.main_tax).toBe(60000); // 1M * 0.06
      expect(result.nds_tax).toBe(0);
      expect(result.contributions).toBe(0);
      expect(result.total).toBe(60000);
    });

    it('should calculate Патент with custom rate', () => {
      const result = calculateTotalTaxForRegime('Патент', 1000000, 0, 2, 500000, 0, 0, 30, 'ИП', 4, 0.05);
      expect(result.main_tax).toBe(50000); // 1M * 0.05
      expect(result.nds_tax).toBe(0);
      expect(result.contributions).toBeGreaterThan(0); // Есть сотрудники
      expect(result.total).toBeGreaterThan(50000);
    });

    it('should throw error for invalid regime', () => {
      expect(() => calculateTotalTaxForRegime('INVALID', 1000000, 0, 0, 0, 0, 0, 30, 'ИП'))
        .toThrow(TaxCalculationError);
    });

    it('should throw error for УСН with revenue > 450M', () => {
      expect(() => calculateTotalTaxForRegime('УСН 6%', 500000000, 0, 0, 0, 0, 0, 30, 'ИП'))
        .toThrow(TaxCalculationError);
      expect(() => calculateTotalTaxForRegime('УСН 6%', 500000000, 0, 0, 0, 0, 0, 30, 'ИП'))
        .toThrow('УСН недоступен');
    });

    it('should throw error for НПД with employees', () => {
      expect(() => calculateTotalTaxForRegime('НПД', 1000000, 0, 5, 0, 0, 0, 30, 'Самозанятый'))
        .toThrow(TaxCalculationError);
      expect(() => calculateTotalTaxForRegime('НПД', 1000000, 0, 5, 0, 0, 0, 30, 'Самозанятый'))
        .toThrow('НПД недоступен при наличии сотрудников');
    });

    it('should throw error for НПД with wrong status', () => {
      expect(() => calculateTotalTaxForRegime('НПД', 1000000, 0, 0, 0, 0, 0, 30, 'ИП'))
        .toThrow(TaxCalculationError);
      expect(() => calculateTotalTaxForRegime('НПД', 1000000, 0, 0, 0, 0, 0, 30, 'ИП'))
        .toThrow('НПД доступен только для самозанятых');
    });

    it('should throw error for Патент with revenue > 2.4M', () => {
      expect(() => calculateTotalTaxForRegime('Патент', 3000000, 0, 0, 0, 0, 0, 30, 'ИП'))
        .toThrow(TaxCalculationError);
      expect(() => calculateTotalTaxForRegime('Патент', 3000000, 0, 0, 0, 0, 0, 30, 'ИП'))
        .toThrow('Патент недоступен при выручке более');
    });
  });

  describe('validateRevenue', () => {
    it('should not throw for valid revenue', () => {
      expect(() => validateRevenue(1000000)).not.toThrow();
      expect(() => validateRevenue(0)).not.toThrow();
      expect(() => validateRevenue(10000000000)).not.toThrow();
    });

    it('should throw for negative revenue', () => {
      expect(() => validateRevenue(-1000)).toThrow(TaxCalculationError);
      expect(() => validateRevenue(-1000)).toThrow('Выручка не может быть отрицательной');
    });

    it('should throw for revenue > 10B', () => {
      expect(() => validateRevenue(10000000001)).toThrow(TaxCalculationError);
      expect(() => validateRevenue(10000000001)).toThrow('Выручка слишком большая');
    });

    it('should throw for NaN revenue', () => {
      expect(() => validateRevenue(NaN)).toThrow(TaxCalculationError);
      expect(() => validateRevenue(NaN)).toThrow('Выручка должна быть числом');
    });

    it('should throw for null/undefined revenue', () => {
      expect(() => validateRevenue(null as any)).toThrow(TaxCalculationError);
      expect(() => validateRevenue(undefined as any)).toThrow(TaxCalculationError);
    });
  });

  describe('validateExpenses', () => {
    it('should not throw for valid expenses', () => {
      expect(() => validateExpenses(500000, 1000000)).not.toThrow();
      expect(() => validateExpenses(0, 1000000)).not.toThrow();
      expect(() => validateExpenses(1000000, 1000000)).not.toThrow();
    });

    it('should throw for negative expenses', () => {
      expect(() => validateExpenses(-1000, 1000000)).toThrow(TaxCalculationError);
      expect(() => validateExpenses(-1000, 1000000)).toThrow('Расходы не могут быть отрицательными');
    });

    it('should throw when expenses exceed revenue', () => {
      expect(() => validateExpenses(2000000, 1000000)).toThrow(TaxCalculationError);
      expect(() => validateExpenses(2000000, 1000000)).toThrow('Расходы не могут превышать выручку');
    });

    it('should throw for NaN expenses', () => {
      expect(() => validateExpenses(NaN, 1000000)).toThrow(TaxCalculationError);
      expect(() => validateExpenses(NaN, 1000000)).toThrow('Расходы должны быть числом');
    });
  });

  describe('validateEmployees', () => {
    it('should not throw for valid employee count', () => {
      expect(() => validateEmployees(0)).not.toThrow();
      expect(() => validateEmployees(5)).not.toThrow();
      expect(() => validateEmployees(10000)).not.toThrow();
    });

    it('should throw for negative employees', () => {
      expect(() => validateEmployees(-1)).toThrow(TaxCalculationError);
      expect(() => validateEmployees(-1)).toThrow('Количество сотрудников не может быть отрицательным');
    });

    it('should throw for employees > 10000', () => {
      expect(() => validateEmployees(10001)).toThrow(TaxCalculationError);
      expect(() => validateEmployees(10001)).toThrow('Количество сотрудников слишком большое');
    });

    it('should throw for NaN employees', () => {
      expect(() => validateEmployees(NaN)).toThrow(TaxCalculationError);
      expect(() => validateEmployees(NaN)).toThrow('Количество сотрудников должно быть числом');
    });
  });

  describe('validateFot', () => {
    it('should not throw for valid FoT', () => {
      expect(() => validateFot(0, 0)).not.toThrow();
      expect(() => validateFot(1000000, 5)).not.toThrow();
    });

    it('should throw for negative FoT', () => {
      expect(() => validateFot(-1000, 5)).toThrow(TaxCalculationError);
      expect(() => validateFot(-1000, 5)).toThrow('ФОТ не может быть отрицательным');
    });

    it('should throw when employees > 0 but FoT = 0', () => {
      expect(() => validateFot(0, 5)).toThrow(TaxCalculationError);
      expect(() => validateFot(0, 5)).toThrow('При наличии сотрудников ФОТ должен быть больше нуля');
    });

    it('should throw for NaN FoT', () => {
      expect(() => validateFot(NaN, 5)).toThrow(TaxCalculationError);
      expect(() => validateFot(NaN, 5)).toThrow('ФОТ должен быть числом');
    });
  });

  describe('validateRegime', () => {
    it('should not throw for valid regimes', () => {
      expect(() => validateRegime('УСН 6%', 'ИП', 1000000, 0)).not.toThrow();
      expect(() => validateRegime('УСН 15%', 'ИП', 1000000, 0)).not.toThrow();
      expect(() => validateRegime('ОСНО', 'ИП', 1000000, 0)).not.toThrow();
      expect(() => validateRegime('Патент', 'ИП', 2000000, 0)).not.toThrow();
      expect(() => validateRegime('НПД', 'Самозанятый', 2000000, 0)).not.toThrow();
    });

    it('should throw for invalid regime', () => {
      expect(() => validateRegime('INVALID', 'ИП', 1000000, 0)).toThrow(TaxCalculationError);
      expect(() => validateRegime('INVALID', 'ИП', 1000000, 0)).toThrow('Недопустимый режим налогообложения');
    });

    it('should throw for empty regime', () => {
      expect(() => validateRegime('', 'ИП', 1000000, 0)).toThrow(TaxCalculationError);
      expect(() => validateRegime('', 'ИП', 1000000, 0)).toThrow('Режим налогообложения не указан');
    });

    it('should throw for Патент with revenue > 2.4M', () => {
      expect(() => validateRegime('Патент', 'ИП', 3000000, 0)).toThrow(TaxCalculationError);
      expect(() => validateRegime('Патент', 'ИП', 3000000, 0)).toThrow('Патент недоступен при выручке более');
    });

    it('should throw for НПД with revenue > 2.4M', () => {
      expect(() => validateRegime('НПД', 'Самозанятый', 3000000, 0)).toThrow(TaxCalculationError);
      expect(() => validateRegime('НПД', 'Самозанятый', 3000000, 0)).toThrow('НПД недоступен при выручке более');
    });

    it('should throw for НПД with wrong status', () => {
      expect(() => validateRegime('НПД', 'ИП', 1000000, 0)).toThrow(TaxCalculationError);
      expect(() => validateRegime('НПД', 'ИП', 1000000, 0)).toThrow('НПД доступен только для самозанятых');
    });

    it('should throw for НПД with employees', () => {
      expect(() => validateRegime('НПД', 'Самозанятый', 1000000, 5)).toThrow(TaxCalculationError);
      expect(() => validateRegime('НПД', 'Самозанятый', 1000000, 5)).toThrow('НПД недоступен при наличии сотрудников');
    });
  });
});
