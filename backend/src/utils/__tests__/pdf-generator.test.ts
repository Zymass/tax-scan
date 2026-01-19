import { generateCalculationHtml } from '../pdf-generator';

describe('PDF Generator', () => {
  describe('generateCalculationHtml', () => {
    it('should generate HTML with all years data', () => {
      const data = {
        status_type: 'ИП',
        tax_regime: 'УСН 6%',
        revenue_2025: 1000000,
        tax_2025: {
          main_tax: 60000,
          nds_tax: 0,
          contributions: 0,
          total: 60000,
        },
        tax_2026: {
          main_tax: 60000,
          nds_tax: 0,
          contributions: 0,
          total: 60000,
        },
        tax_2027: {
          main_tax: 60000,
          nds_tax: 0,
          contributions: 0,
          total: 60000,
        },
        tax_2028: {
          main_tax: 60000,
          nds_tax: 0,
          contributions: 0,
          total: 60000,
        },
        recommendation: 'Рекомендуемый режим: УСН 6%',
      };

      const html = generateCalculationHtml(data);

      expect(html).toContain('Расчет налоговой нагрузки');
      expect(html).toContain('ИП');
      expect(html).toContain('УСН 6%');
      expect(html).toContain('1\u00A0000\u00A0000'); // Non-breaking spaces
      expect(html).toContain('2025 (факт)');
      expect(html).toContain('2026 (прогноз)');
      expect(html).toContain('2027 (прогноз)');
      expect(html).toContain('2028 (прогноз)');
      expect(html).toContain('60\u00A0000'); // Non-breaking spaces
    });

    it('should include НДС threshold information', () => {
      const data = {
        status_type: 'ИП',
        tax_regime: 'УСН 6%',
        revenue_2025: 25000000,
        tax_2025: {
          main_tax: 1500000,
          nds_tax: 0,
          contributions: 0,
          total: 1500000,
        },
        tax_2026: {
          main_tax: 1500000,
          nds_tax: 1250000,
          contributions: 0,
          total: 2750000,
        },
        tax_2027: {
          main_tax: 1500000,
          nds_tax: 1250000,
          contributions: 0,
          total: 2750000,
        },
        tax_2028: {
          main_tax: 1500000,
          nds_tax: 1250000,
          contributions: 0,
          total: 2750000,
        },
        recommendation: 'Рекомендуемый режим: УСН 6%',
      };

      const html = generateCalculationHtml(data);

      expect(html).toContain('(порог: 20M)');
      expect(html).toContain('(порог: 15M)');
      expect(html).toContain('(порог: 10M)');
      expect(html).toContain('Изменения порогов НДС');
    });

    it('should handle missing tax data with defaults', () => {
      const data = {
        status_type: 'ИП',
        tax_regime: 'УСН 6%',
        revenue_2025: 1000000,
      };

      const html = generateCalculationHtml(data);

      expect(html).toContain('0');
      expect(html).toContain('2027 (прогноз)');
      expect(html).toContain('2028 (прогноз)');
    });

    it('should format numbers correctly', () => {
      const data = {
        status_type: 'ИП',
        tax_regime: 'УСН 6%',
        revenue_2025: 12345678,
        tax_2025: {
          main_tax: 740740,
          nds_tax: 0,
          contributions: 0,
          total: 740740,
        },
        tax_2026: {
          main_tax: 740740,
          nds_tax: 0,
          contributions: 0,
          total: 740740,
        },
        tax_2027: {
          main_tax: 740740,
          nds_tax: 0,
          contributions: 0,
          total: 740740,
        },
        tax_2028: {
          main_tax: 740740,
          nds_tax: 0,
          contributions: 0,
          total: 740740,
        },
        recommendation: 'Рекомендуемый режим: УСН 6%',
      };

      const html = generateCalculationHtml(data);

      expect(html).toContain('12\u00A0345\u00A0678'); // Non-breaking spaces
      expect(html).toContain('740\u00A0740'); // Non-breaking spaces
    });

    it('should handle null and undefined values', () => {
      const data = {
        status_type: 'ИП',
        tax_regime: 'УСН 6%',
        revenue_2025: 1000000,
        tax_2025: null,
        tax_2026: undefined,
        tax_2027: {
          main_tax: null,
          nds_tax: undefined,
          contributions: 0,
          total: 0,
        },
        tax_2028: {
          main_tax: 0,
          nds_tax: 0,
          contributions: 0,
          total: 0,
        },
      };

      const html = generateCalculationHtml(data);

      expect(html).toContain('0');
      expect(html).not.toContain('null');
      expect(html).not.toContain('undefined');
    });

    it('should include recommendation section', () => {
      const data = {
        status_type: 'ИП',
        tax_regime: 'УСН 6%',
        revenue_2025: 1000000,
        tax_2025: { main_tax: 0, nds_tax: 0, contributions: 0, total: 0 },
        tax_2026: { main_tax: 0, nds_tax: 0, contributions: 0, total: 0 },
        tax_2027: { main_tax: 0, nds_tax: 0, contributions: 0, total: 0 },
        tax_2028: { main_tax: 0, nds_tax: 0, contributions: 0, total: 0 },
        recommendation: 'Рекомендуемый режим: УСН 15%. Экономия: 50 000 ₽',
      };

      const html = generateCalculationHtml(data);

      expect(html).toContain('Рекомендация');
      expect(html).toContain('Рекомендуемый режим: УСН 15%. Экономия: 50 000 ₽');
    });

    it('should use default recommendation if not provided', () => {
      const data = {
        status_type: 'ИП',
        tax_regime: 'УСН 6%',
        revenue_2025: 1000000,
        tax_2025: { main_tax: 0, nds_tax: 0, contributions: 0, total: 0 },
        tax_2026: { main_tax: 0, nds_tax: 0, contributions: 0, total: 0 },
        tax_2027: { main_tax: 0, nds_tax: 0, contributions: 0, total: 0 },
        tax_2028: { main_tax: 0, nds_tax: 0, contributions: 0, total: 0 },
      };

      const html = generateCalculationHtml(data);

      expect(html).toContain('Нет рекомендаций');
    });
  });
});
