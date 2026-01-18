export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
}

export interface AuthResponse {
  token: string;
  refresh_token: string;
  user: User;
  expires_in: number;
}

export interface Calculation {
  id: string;
  user_id: string;
  status_type: string;
  tax_regime: string;
  revenue_2025: number;
  total_tax_2025: number;
  total_tax_2026: number;
  recommended_regime: string;
  recommended_savings: number;
  current_step: number;
  status: 'in_progress' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface TaxBreakdown {
  main_tax: number;
  nds_tax: number;
  contributions: number;
  total: number;
}

export interface RegimeOption {
  regime: string;
  total_tax: number;
  available: boolean;
  recommended: boolean;
}

export interface CalculationData {
  status_type: string;
  revenue_2025: number;
  tax_2025: TaxBreakdown;
  tax_2026: TaxBreakdown;
  tax_2027: TaxBreakdown;
  tax_2028: TaxBreakdown;
  regime_comparison: RegimeOption[];
  recommended_regime: string;
  recommended_savings: number;
}

export interface FormStep1 {
  status_type: 'ИП' | 'ООО' | 'Самозанятый';
  tax_regime: string;
  revenue_2025: number;
  expenses_2025?: number;
  region_code?: string;
}

export interface FormStep2 {
  count_employees: number;
  fot_year?: number;
  contribution_rate?: number;
}

export interface FormStep3 {
  applies_nds: boolean;
  nds_rate?: number;
  incoming_nds?: number;
}

export interface ActionPlan {
  id: string;
  action_code: string;
  action_name: string;
  description: string;
  due_date: string;
  completed: boolean;
  importance: 'critical' | 'high' | 'medium' | 'low';
  category: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'ongoing';
}
