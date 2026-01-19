import {
  registerSchema,
  loginSchema,
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
} from '../validators';

describe('Validators', () => {
  describe('registerSchema', () => {
    it('should validate valid registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const { error } = registerSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should validate with optional phone', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        phone: '+79991234567',
      };

      const { error } = registerSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User',
      };

      const { error } = registerSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('email');
    });

    it('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'short',
        name: 'Test User',
      };

      const { error } = registerSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('password');
    });

    it('should reject short name', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'A',
      };

      const { error } = registerSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('name');
    });

    it('should reject invalid phone format', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        phone: '123',
      };

      const { error } = registerSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('phone');
    });
  });

  describe('loginSchema', () => {
    it('should validate valid login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const { error } = loginSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
      };

      const { error } = loginSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('should reject missing password', () => {
      const invalidData = {
        email: 'test@example.com',
      };

      const { error } = loginSchema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });

  describe('step1Schema', () => {
    it('should validate valid step1 data', () => {
      const validData = {
        status_type: 'ИП',
        tax_regime: 'УСН 6%',
        revenue_2025: 1000000,
        expenses_2025: 100000,
        region_code: '77',
      };

      const { error } = step1Schema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject invalid status_type', () => {
      const invalidData = {
        status_type: 'INVALID',
        tax_regime: 'УСН 6%',
        revenue_2025: 1000000,
      };

      const { error } = step1Schema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('status_type');
    });

    it('should reject negative revenue', () => {
      const invalidData = {
        status_type: 'ИП',
        tax_regime: 'УСН 6%',
        revenue_2025: -1000,
      };

      const { error } = step1Schema.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('should reject revenue exceeding max', () => {
      const invalidData = {
        status_type: 'ИП',
        tax_regime: 'УСН 6%',
        revenue_2025: 2000000000,
      };

      const { error } = step1Schema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });

  describe('step2Schema', () => {
    it('should validate valid step2 data', () => {
      const validData = {
        count_employees: 5,
        fot_year: 3000000,
        contribution_rate: 30,
        additional_contributions: 10000,
      };

      const { error } = step2Schema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject negative employees', () => {
      const invalidData = {
        count_employees: -1,
        fot_year: 3000000,
      };

      const { error } = step2Schema.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('should reject employees exceeding max', () => {
      const invalidData = {
        count_employees: 2000,
        fot_year: 3000000,
      };

      const { error } = step2Schema.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('should reject invalid contribution_rate', () => {
      const invalidData = {
        count_employees: 5,
        fot_year: 3000000,
        contribution_rate: 20,
      };

      const { error } = step2Schema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });

  describe('step3Schema', () => {
    it('should validate valid step3 data', () => {
      const validData = {
        applies_nds: true,
        nds_rate: 5,
        incoming_nds: 100000,
      };

      const { error } = step3Schema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should validate when НДС not applies', () => {
      const validData = {
        applies_nds: false,
      };

      const { error } = step3Schema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject invalid nds_rate', () => {
      const invalidData = {
        applies_nds: true,
        nds_rate: 10,
      };

      const { error } = step3Schema.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('should reject negative incoming_nds', () => {
      const invalidData = {
        applies_nds: true,
        nds_rate: 5,
        incoming_nds: -1000,
      };

      const { error } = step3Schema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });

  describe('step4Schema', () => {
    it('should validate valid step4 data', () => {
      const validData = {
        regime: 'УСН 6%',
        main_tax_year: 60000,
        expenses: 100000,
      };

      const { error } = step4Schema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject missing regime', () => {
      const invalidData = {
        main_tax_year: 60000,
      };

      const { error } = step4Schema.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('should reject negative expenses', () => {
      const invalidData = {
        regime: 'УСН 6%',
        expenses: -1000,
      };

      const { error } = step4Schema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });
});
