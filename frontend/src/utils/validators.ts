export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; error?: string } => {
  if (password.length < 8) {
    return { isValid: false, error: 'Пароль должен содержать минимум 8 символов' };
  }
  return { isValid: true };
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[0-9]{10,}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const validateRevenue = (revenue: number): { isValid: boolean; error?: string } => {
  if (revenue <= 0) {
    return { isValid: false, error: 'Выручка должна быть больше 0' };
  }
  if (revenue > 1000000000) {
    return { isValid: false, error: 'Выручка не может превышать 1 000 000 000 руб.' };
  }
  return { isValid: true };
};

export const validateExpenses = (expenses: number, revenue: number): { isValid: boolean; error?: string } => {
  if (expenses < 0) {
    return { isValid: false, error: 'Расходы не могут быть отрицательными' };
  }
  if (expenses > revenue) {
    return { isValid: false, error: 'Расходы не могут превышать выручку' };
  }
  return { isValid: true };
};

export const validateEmployees = (count: number): { isValid: boolean; error?: string } => {
  if (count < 0) {
    return { isValid: false, error: 'Количество сотрудников не может быть отрицательным' };
  }
  if (count > 1000) {
    return { isValid: false, error: 'Количество сотрудников не может превышать 1000' };
  }
  return { isValid: true };
};

export const validateFot = (fot: number): { isValid: boolean; error?: string } => {
  if (fot < 0) {
    return { isValid: false, error: 'ФОТ не может быть отрицательным' };
  }
  if (fot > 1000000000) {
    return { isValid: false, error: 'ФОТ не может превышать 1 000 000 000 руб.' };
  }
  return { isValid: true };
};

export const validateNdsRate = (rate: number): { isValid: boolean; error?: string } => {
  const validRates = [0, 5, 7, 22];
  if (!validRates.includes(rate)) {
    return { isValid: false, error: 'НДС ставка должна быть 0, 5, 7 или 22%' };
  }
  return { isValid: true };
};

export const validateStep1 = (data: {
  status_type: string;
  tax_regime: string;
  revenue_2025: number;
  expenses_2025?: number;
}): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!data.status_type) {
    errors.status_type = 'Выберите статус';
  }

  if (!data.tax_regime) {
    errors.tax_regime = 'Выберите режим налогообложения';
  }

  const revenueValidation = validateRevenue(data.revenue_2025);
  if (!revenueValidation.isValid) {
    errors.revenue_2025 = revenueValidation.error || 'Неверная выручка';
  }

  if (data.expenses_2025 !== undefined) {
    const expensesValidation = validateExpenses(data.expenses_2025, data.revenue_2025);
    if (!expensesValidation.isValid) {
      errors.expenses_2025 = expensesValidation.error || 'Неверные расходы';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateStep2 = (data: {
  count_employees: number;
  fot_year?: number;
}): ValidationResult => {
  const errors: Record<string, string> = {};

  const employeesValidation = validateEmployees(data.count_employees);
  if (!employeesValidation.isValid) {
    errors.count_employees = employeesValidation.error || 'Неверное количество сотрудников';
  }

  if (data.fot_year !== undefined) {
    const fotValidation = validateFot(data.fot_year);
    if (!fotValidation.isValid) {
      errors.fot_year = fotValidation.error || 'Неверный ФОТ';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateStep3 = (data: {
  applies_nds: boolean;
  nds_rate?: number;
  incoming_nds?: number;
}): ValidationResult => {
  const errors: Record<string, string> = {};

  if (data.applies_nds && data.nds_rate !== undefined) {
    const ndsValidation = validateNdsRate(data.nds_rate);
    if (!ndsValidation.isValid) {
      errors.nds_rate = ndsValidation.error || 'Неверная ставка НДС';
    }
  }

  if (data.incoming_nds !== undefined && data.incoming_nds < 0) {
    errors.incoming_nds = 'Входящий НДС не может быть отрицательным';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
