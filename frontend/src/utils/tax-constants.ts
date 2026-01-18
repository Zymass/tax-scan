export const TAX_REGIMES = [
  { value: 'УСН 6%', label: 'УСН 6% (Доходы)' },
  { value: 'УСН 15%', label: 'УСН 15% (Доходы минус расходы)' },
  { value: 'ОСНО', label: 'ОСНО (Основная система)' },
  { value: 'Патент', label: 'Патент' },
  { value: 'НПД', label: 'НПД (Самозанятый)' }
];

export const STATUS_TYPES = [
  { value: 'ИП', label: 'ИП (Индивидуальный предприниматель)' },
  { value: 'ООО', label: 'ООО (Общество с ограниченной ответственностью)' },
  { value: 'Самозанятый', label: 'Самозанятый (НПД)' }
];

export const REGIONS = [
  { code: '01', label: 'Москва' },
  { code: '02', label: 'Московская область' },
  { code: '03', label: 'Санкт-Петербург' },
  { code: '04', label: 'Ленинградская область' },
  { code: '77', label: 'Москва' },
  { code: '78', label: 'Санкт-Петербург' }
];

export const NDS_RATES = [
  { value: 5, label: '5% (для выручки 20-272M)' },
  { value: 7, label: '7% (для выручки 272-490M)' },
  { value: 22, label: '22% (стандартная)' }
];

export const ACTION_PLAN_DATA = [
  {
    action_code: 'submit_form_1',
    action_name: 'Подать уведомление о переходе на УСН 15%',
    description: 'Форма 26.2-6. Отнести в ФНС или отправить по почте',
    daysFromNow: 14,
    importance: 'critical',
    category: 'ongoing'
  },
  {
    action_code: 'submit_declaration',
    action_name: 'Подать декларацию УСН за 2025 год',
    description: 'Форма УСН-3.1а или УСН-3.1б',
    daysFromNow: 45,
    importance: 'critical',
    category: 'Q1'
  },
  {
    action_code: 'pay_tax_2025',
    action_name: 'Уплатить налог за 2025 год',
    description: 'Переводом через банк или портал ФНС',
    daysFromNow: 45,
    importance: 'critical',
    category: 'Q1'
  }
];
