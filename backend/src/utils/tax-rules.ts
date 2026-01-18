interface TaxRuleResult {
  main_tax: number;
  nds_tax: number;
  contributions: number;
  total: number;
}

export class TaxCalculationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'TaxCalculationError';
  }
}

export const TAX_CONSTANTS = {
  MROT_2025: 16242,
  MROT_2026: 16242,
  CONTRIBUTION_THRESHOLD: 20000000,
  NDS_THRESHOLD_1: 20000000,
  NDS_THRESHOLD_2: 272000000,
  NDS_THRESHOLD_3: 450000000,
  PATENT_MAX_REVENUE: 2400000,
  NDP_MAX_REVENUE: 2400000,
  UСН_MAX_REVENUE: 450000000,
  ADDITIONAL_CONTRIBUTION_THRESHOLD: 1465000
};

export function validateRevenue(revenue: number): void {
  if (revenue === undefined || revenue === null || isNaN(revenue)) {
    throw new TaxCalculationError('Выручка должна быть числом', 'revenue');
  }
  if (revenue < 0) {
    throw new TaxCalculationError('Выручка не может быть отрицательной', 'revenue');
  }
  if (revenue > 10000000000) {
    throw new TaxCalculationError('Выручка слишком большая (максимум 10 млрд руб.)', 'revenue');
  }
}

export function validateExpenses(expenses: number, revenue: number): void {
  if (expenses === undefined || expenses === null || isNaN(expenses)) {
    throw new TaxCalculationError('Расходы должны быть числом', 'expenses');
  }
  if (expenses < 0) {
    throw new TaxCalculationError('Расходы не могут быть отрицательными', 'expenses');
  }
  if (expenses > revenue) {
    throw new TaxCalculationError('Расходы не могут превышать выручку', 'expenses');
  }
}

export function validateEmployees(countEmployees: number): void {
  if (countEmployees === undefined || countEmployees === null || isNaN(countEmployees)) {
    throw new TaxCalculationError('Количество сотрудников должно быть числом', 'count_employees');
  }
  if (countEmployees < 0) {
    throw new TaxCalculationError('Количество сотрудников не может быть отрицательным', 'count_employees');
  }
  if (countEmployees > 10000) {
    throw new TaxCalculationError('Количество сотрудников слишком большое (максимум 10000)', 'count_employees');
  }
}

export function validateFot(fot: number, countEmployees: number): void {
  if (fot === undefined || fot === null || isNaN(fot)) {
    throw new TaxCalculationError('ФОТ должен быть числом', 'fot');
  }
  if (fot < 0) {
    throw new TaxCalculationError('ФОТ не может быть отрицательным', 'fot');
  }
  if (countEmployees > 0 && fot === 0) {
    throw new TaxCalculationError('При наличии сотрудников ФОТ должен быть больше нуля', 'fot');
  }
}

export function validateRegime(regime: string, statusType: string, revenue: number, countEmployees: number): void {
  const validRegimes = ['УСН 6%', 'УСН 15%', 'ОСНО', 'Патент', 'НПД'];
  
  if (!regime || typeof regime !== 'string') {
    throw new TaxCalculationError('Режим налогообложения не указан', 'tax_regime');
  }
  
  if (!validRegimes.includes(regime)) {
    throw new TaxCalculationError(
      `Недопустимый режим налогообложения: ${regime}. Допустимые: ${validRegimes.join(', ')}`,
      'tax_regime'
    );
  }

  // Проверка ограничений по режимам
  if (regime === 'УСН 6%' || regime === 'УСН 15%') {
    if (revenue > TAX_CONSTANTS.UСН_MAX_REVENUE) {
      throw new TaxCalculationError(
        `УСН недоступен при выручке более ${TAX_CONSTANTS.UСН_MAX_REVENUE.toLocaleString('ru-RU')} руб.`,
        'tax_regime'
      );
    }
  }

  if (regime === 'НПД') {
    if (statusType !== 'Самозанятый') {
      throw new TaxCalculationError('НПД доступен только для самозанятых', 'tax_regime');
    }
    if (revenue > TAX_CONSTANTS.NDP_MAX_REVENUE) {
      throw new TaxCalculationError(
        `НПД недоступен при выручке более ${TAX_CONSTANTS.NDP_MAX_REVENUE.toLocaleString('ru-RU')} руб.`,
        'tax_regime'
      );
    }
    if (countEmployees > 0) {
      throw new TaxCalculationError('НПД недоступен при наличии сотрудников', 'tax_regime');
    }
  }
}

export function calculateUsnTax(
  revenue: number,
  rate: number,
  expenses: number = 0
): number {
  validateRevenue(revenue);
  if (expenses !== 0) {
    validateExpenses(expenses, revenue);
  }

  if (rate !== 6 && rate !== 15) {
    throw new TaxCalculationError(`Недопустимая ставка УСН: ${rate}. Допустимые: 6, 15`, 'rate');
  }

  if (rate === 6) {
    return revenue * 0.06;
  } else if (rate === 15) {
    const taxable = Math.max(0, revenue - expenses);
    return taxable * 0.15;
  }
  return 0;
}

export function calculateNdsTax(
  revenue: number,
  rate: number,
  incomingNds: number = 0
): number {
  validateRevenue(revenue);
  
  if (incomingNds < 0) {
    throw new TaxCalculationError('Входящий НДС не может быть отрицательным', 'incoming_nds');
  }

  if (rate === 0) {
    return 0; // Освобожден
  }

  const validRates = [5, 7, 22];
  if (!validRates.includes(rate)) {
    throw new TaxCalculationError(
      `Недопустимая ставка НДС: ${rate}. Допустимые: ${validRates.join(', ')}`,
      'nds_rate'
    );
  }

  const ndsAmount = revenue * (rate / 100);

  if (rate === 22) {
    return Math.max(0, ndsAmount - incomingNds);
  }

  return ndsAmount;
}

export function calculateContributions(
  countEmployees: number,
  fot: number,
  rate: number = 30
): number {
  validateEmployees(countEmployees);
  validateFot(fot, countEmployees);

  if (countEmployees === 0) {
    return 0;
  }

  const validRates = [15, 30];
  if (!validRates.includes(rate)) {
    throw new TaxCalculationError(
      `Недопустимая ставка взносов: ${rate}. Допустимые: ${validRates.join(', ')}`,
      'contribution_rate'
    );
  }

  let contributions = fot * (rate / 100);

  // Additional 1% if FoT exceeds threshold
  if (fot > TAX_CONSTANTS.ADDITIONAL_CONTRIBUTION_THRESHOLD && rate === 30) {
    const additionalAmount = fot - TAX_CONSTANTS.ADDITIONAL_CONTRIBUTION_THRESHOLD;
    contributions += additionalAmount * 0.01;
  }

  return contributions;
}

export function getNdsRate(revenue: number, appliesNds: boolean): number {
  validateRevenue(revenue);
  
  if (!appliesNds) return 0;

  if (revenue <= TAX_CONSTANTS.NDS_THRESHOLD_1) {
    return 0; // Освобожден
  } else if (revenue <= TAX_CONSTANTS.NDS_THRESHOLD_2) {
    return 5;
  } else if (revenue < TAX_CONSTANTS.NDS_THRESHOLD_3) {
    return 7;
  } else {
    return 22;
  }
}

export function recommendedRegime(
  revenue: number,
  expenses: number,
  countEmployees: number,
  fot: number
): string {
  validateRevenue(revenue);
  if (expenses > 0) {
    validateExpenses(expenses, revenue);
  }
  validateEmployees(countEmployees);
  if (fot > 0) {
    validateFot(fot, countEmployees);
  }

  if (revenue > TAX_CONSTANTS.UСН_MAX_REVENUE) {
    return 'ОСНО';
  }

  const usn6 = calculateUsnTax(revenue, 6);
  const usn15 = calculateUsnTax(revenue, 15, expenses);

  return usn15 < usn6 ? 'УСН 15%' : 'УСН 6%';
}

export function calculateTotalTaxForRegime(
  regime: string,
  revenue: number,
  expenses: number,
  countEmployees: number,
  fot: number,
  ndsRate: number,
  incomingNds: number = 0,
  contributionRate: number = 30,
  statusType: string = 'ИП'
): TaxRuleResult {
  // Валидация всех входных данных
  validateRevenue(revenue);
  if (expenses > 0) {
    validateExpenses(expenses, revenue);
  }
  validateEmployees(countEmployees);
  if (fot > 0) {
    validateFot(fot, countEmployees);
  }
  validateRegime(regime, statusType, revenue, countEmployees);

  let mainTax = 0;
  let ndsTax = 0;
  let contributions = 0;

  switch (regime) {
    case 'УСН 6%':
      mainTax = calculateUsnTax(revenue, 6);
      ndsTax = calculateNdsTax(revenue, ndsRate, incomingNds);
      contributions = calculateContributions(countEmployees, fot, contributionRate);
      break;

    case 'УСН 15%':
      mainTax = calculateUsnTax(revenue, 15, expenses);
      ndsTax = 0; // НДС не платится при УСН 15%
      contributions = calculateContributions(countEmployees, fot, contributionRate);
      break;

    case 'ОСНО':
      mainTax = revenue * 0.13; // НДФЛ для ИП
      ndsTax = calculateNdsTax(revenue, 22, incomingNds); // ОСНО - всегда 22%
      contributions = calculateContributions(countEmployees, fot, contributionRate);
      break;

    case 'НПД':
      mainTax = revenue * 0.04; // или 0.06
      ndsTax = 0;
      contributions = 0; // Самозанятый не платит взносы
      break;

    default:
      throw new TaxCalculationError(`Неподдерживаемый режим налогообложения: ${regime}`, 'tax_regime');
  }

  const total = mainTax + ndsTax + contributions;

  return {
    main_tax: Math.round(mainTax),
    nds_tax: Math.round(ndsTax),
    contributions: Math.round(contributions),
    total: Math.round(total)
  };
}
