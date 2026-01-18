import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).required(),
  phone: Joi.string().pattern(/^\+?[0-9]{10,}$/).optional()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const step1Schema = Joi.object({
  status_type: Joi.string().valid('ИП', 'ООО', 'Самозанятый').required(),
  tax_regime: Joi.string().required(),
  revenue_2025: Joi.number().min(0).max(1000000000).required(),
  region_code: Joi.string().optional(),
  expenses_2025: Joi.number().min(0).optional()
});

export const step2Schema = Joi.object({
  count_employees: Joi.number().min(0).max(1000).required(),
  fot_year: Joi.number().min(0).max(1000000000).optional(),
  contribution_rate: Joi.number().valid(15, 30).optional(),
  additional_contributions: Joi.number().min(0).optional()
});

export const step3Schema = Joi.object({
  applies_nds: Joi.boolean().required(),
  nds_rate: Joi.number().valid(5, 7, 22).optional(),
  incoming_nds: Joi.number().min(0).optional()
});

export const step4Schema = Joi.object({
  regime: Joi.string().required(),
  main_tax_year: Joi.number().min(0).optional(),
  expenses: Joi.number().min(0).optional()
});
