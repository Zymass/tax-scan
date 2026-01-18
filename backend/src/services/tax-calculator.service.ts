import {
  calculateUsnTax,
  calculateNdsTax,
  calculateContributions,
  getNdsRate,
  calculateTotalTaxForRegime,
  TAX_CONSTANTS,
  TaxCalculationError
} from '../utils/tax-rules';

export interface CalculationInput {
  status_type: string;
  tax_regime: string;
  revenue_2025: number;
  expenses_2025?: number;
  count_employees: number;
  fot_year?: number;
  applies_nds: boolean;
  nds_rate?: number;
  incoming_nds?: number;
  region_code?: string;
}

export interface CalculationOutput {
  status_type: string;
  revenue_2025: number;
  tax_2025: {
    main_tax: number;
    nds_tax: number;
    contributions: number;
    total: number;
  };
  tax_2026: {
    main_tax: number;
    nds_tax: number;
    contributions: number;
    total: number;
  };
  tax_2027: {
    main_tax: number;
    nds_tax: number;
    contributions: number;
    total: number;
  };
  tax_2028: {
    main_tax: number;
    nds_tax: number;
    contributions: number;
    total: number;
  };
  regime_comparison: Array<{
    regime: string;
    total_tax: number;
    available: boolean;
    recommended: boolean;
  }>;
  recommended_regime: string;
  recommended_savings: number;
}

export class TaxCalculatorService {
  calculate(input: CalculationInput): CalculationOutput {
    // Валидация входных данных
    this.validateInput(input);

    const {
      status_type,
      tax_regime,
      revenue_2025,
      expenses_2025 = 0,
      count_employees = 0,
      fot_year = 0,
      applies_nds = false,
      nds_rate = 0,
      incoming_nds = 0
    } = input;

    try {
      // 2025 calculations (15% contributions for employees, old rates)
      const contributionRate2025 = 15; // В 2025 году ставка 15%
      const tax2025 = calculateTotalTaxForRegime(
        tax_regime,
        revenue_2025,
        expenses_2025,
        count_employees,
        fot_year,
        applies_nds ? nds_rate : 0,
        incoming_nds,
        contributionRate2025,
        status_type
      );

      // 2026 calculations (30% contributions for employees if revenue > 20M, new NDS rates)
      const contributionRate2026 = count_employees > 0 && revenue_2025 > TAX_CONSTANTS.CONTRIBUTION_THRESHOLD ? 30 : 15;
      const ndsRate2026 = this.getNdsRateForYear(revenue_2025, 2026);

      const tax2026 = calculateTotalTaxForRegime(
        tax_regime,
        revenue_2025,
        expenses_2025,
        count_employees,
        fot_year,
        applies_nds ? ndsRate2026 : 0,
        incoming_nds,
        contributionRate2026,
        status_type
      );

      // Calculate alternative regimes
      const regimeComparison = this.compareAllRegimes(
        revenue_2025,
        expenses_2025,
        count_employees,
        fot_year,
        applies_nds,
        ndsRate2026,
        incoming_nds,
        status_type
      );

      const currentTaxTotal = tax2026.total;
      const recommendedRegime = regimeComparison.find(r => r.recommended)?.regime || tax_regime;
      const recommendedTax = regimeComparison.find(r => r.regime === recommendedRegime)?.total_tax || currentTaxTotal;
      const recommendedSavings = currentTaxTotal - recommendedTax;

      return {
        status_type,
        revenue_2025,
        tax_2025: tax2025,
        tax_2026: tax2026,
        tax_2027: tax2026, // Approximation (simplified for MVP)
        tax_2028: tax2026, // Approximation (simplified for MVP)
        regime_comparison: regimeComparison,
        recommended_regime: recommendedRegime,
        recommended_savings: Math.max(0, recommendedSavings)
      };
    } catch (error) {
      if (error instanceof TaxCalculationError) {
        throw error;
      }
      throw new TaxCalculationError(
        `Ошибка при расчете налогов: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      );
    }
  }

  private validateInput(input: CalculationInput): void {
    const validStatusTypes = ['ИП', 'ООО', 'Самозанятый'];
    
    if (!input.status_type || !validStatusTypes.includes(input.status_type)) {
      throw new TaxCalculationError(
        `Недопустимый статус: ${input.status_type}. Допустимые: ${validStatusTypes.join(', ')}`,
        'status_type'
      );
    }

    if (input.applies_nds && input.nds_rate === undefined) {
      throw new TaxCalculationError('При применении НДС необходимо указать ставку НДС', 'nds_rate');
    }
  }

  private getNdsRateForYear(revenue: number, year: number): number {
    // In 2026 and beyond, NDS rates change based on threshold reductions
    const thresholds2026 = {
      threshold1: 20000000,
      threshold2: 272000000,
      threshold3: 450000000
    };

    if (revenue <= thresholds2026.threshold1) {
      return 0;
    } else if (revenue <= thresholds2026.threshold2) {
      return 5;
    } else if (revenue < thresholds2026.threshold3) {
      return 7;
    } else {
      return 22;
    }
  }

  private compareAllRegimes(
    revenue: number,
    expenses: number,
    countEmployees: number,
    fot: number,
    appliesNds: boolean,
    ndsRate: number,
    incomingNds: number,
    statusType: string
  ) {
    const regimes = ['УСН 6%', 'УСН 15%', 'ОСНО', 'НПД'];
    const results = [];

    for (const regime of regimes) {
      const isAvailable = this.isRegimeAvailable(regime, revenue, countEmployees, statusType);

      if (!isAvailable) {
        results.push({
          regime,
          total_tax: 0,
          available: false,
          recommended: false
        });
        continue;
      }

      try {
        const contributionRate = countEmployees > 0 && revenue > TAX_CONSTANTS.CONTRIBUTION_THRESHOLD ? 30 : 15;
        const tax = calculateTotalTaxForRegime(
          regime,
          revenue,
          expenses,
          countEmployees,
          fot,
          appliesNds && ['УСН 6%', 'ОСНО'].includes(regime) ? ndsRate : 0,
          incomingNds,
          contributionRate,
          statusType
        );

        results.push({
          regime,
          total_tax: tax.total,
          available: true,
          recommended: false
        });
      } catch (error) {
        // Если режим недоступен из-за ограничений, помечаем как недоступный
        results.push({
          regime,
          total_tax: 0,
          available: false,
          recommended: false
        });
      }
    }

    // Mark the cheapest as recommended
    const availableResults = results.filter(r => r.available);
    if (availableResults.length > 0) {
      const minTax = Math.min(...availableResults.map(r => r.total_tax));
      const cheapest = results.find(r => r.available && r.total_tax === minTax);
      if (cheapest) {
        cheapest.recommended = true;
      }
    }

    return results;
  }

  private isRegimeAvailable(regime: string, revenue: number, countEmployees: number, statusType: string): boolean {
    switch (regime) {
      case 'УСН 6%':
      case 'УСН 15%':
        return revenue <= TAX_CONSTANTS.UСН_MAX_REVENUE;

      case 'НПД':
        return revenue <= TAX_CONSTANTS.NDP_MAX_REVENUE && 
               countEmployees === 0 && 
               statusType === 'Самозанятый';

      case 'ОСНО':
        return true; // Always available

      default:
        return false;
    }
  }
}
