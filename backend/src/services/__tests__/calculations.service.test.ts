import { CalculationsService } from '../calculations.service';
import { prisma } from '../../db';
import { TaxCalculatorService } from '../tax-calculator.service';

// Mock dependencies
jest.mock('../../db', () => ({
  prisma: {
    calculation: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    calculationStep: {
      upsert: jest.fn(),
    },
  },
}));

jest.mock('../tax-calculator.service');

describe('CalculationsService', () => {
  let service: CalculationsService;
  let mockTaxCalcService: jest.Mocked<TaxCalculatorService>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CalculationsService();
    mockTaxCalcService = (service as any).taxCalcService as jest.Mocked<TaxCalculatorService>;
  });

  describe('createCalculation', () => {
    it('should create a new calculation with default values', async () => {
      const userId = 'user-123';
      const mockCalculation = {
        id: 'calc-123',
        user_id: userId,
        status_type: 'ИП',
        tax_regime: 'УСН 6%',
        revenue_2025: 0,
        total_tax_2025: 0,
        total_tax_2026: 0,
        total_tax_2027: 0,
        total_tax_2028: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (prisma.calculation.create as jest.Mock).mockResolvedValue(mockCalculation);

      const result = await service.createCalculation(userId);

      expect(prisma.calculation.create).toHaveBeenCalledWith({
        data: {
          user_id: userId,
          status_type: 'ИП',
          tax_regime: 'УСН 6%',
          revenue_2025: 0,
          total_tax_2025: 0,
          total_tax_2026: 0,
          total_tax_2027: 0,
          total_tax_2028: 0,
        },
      });
      expect(result).toEqual(mockCalculation);
    });
  });

  describe('getCalculations', () => {
    it('should fetch calculations for a user', async () => {
      const userId = 'user-123';
      const mockCalculations = [
        {
          id: 'calc-1',
          user_id: userId,
          status_type: 'ИП',
          tax_regime: 'УСН 6%',
          created_at: new Date(),
        },
        {
          id: 'calc-2',
          user_id: userId,
          status_type: 'ООО',
          tax_regime: 'УСН 15%',
          created_at: new Date(),
        },
      ];

      (prisma.calculation.findMany as jest.Mock).mockResolvedValue(mockCalculations);

      const result = await service.getCalculations(userId, 10, 0);

      expect(prisma.calculation.findMany).toHaveBeenCalledWith({
        where: {
          user_id: userId,
          deleted_at: null,
        },
        skip: 0,
        take: 10,
        orderBy: { created_at: 'desc' },
      });
      expect(result).toEqual(mockCalculations);
    });

    it('should respect limit and offset parameters', async () => {
      const userId = 'user-123';
      (prisma.calculation.findMany as jest.Mock).mockResolvedValue([]);

      await service.getCalculations(userId, 5, 10);

      expect(prisma.calculation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 5,
        })
      );
    });
  });

  describe('getCalculation', () => {
    it('should fetch a calculation by id for a user', async () => {
      const userId = 'user-123';
      const calculationId = 'calc-123';
      const mockCalculation = {
        id: calculationId,
        user_id: userId,
        status_type: 'ИП',
        tax_regime: 'УСН 6%',
        steps: [],
        actions: [],
      };

      (prisma.calculation.findUnique as jest.Mock).mockResolvedValue(mockCalculation);

      const result = await service.getCalculation(calculationId, userId);

      expect(prisma.calculation.findUnique).toHaveBeenCalledWith({
        where: { id: calculationId },
        include: { steps: true, actions: true },
      });
      expect(result).toEqual(mockCalculation);
    });

    it('should throw error if calculation not found', async () => {
      const userId = 'user-123';
      const calculationId = 'calc-123';

      (prisma.calculation.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getCalculation(calculationId, userId)).rejects.toThrow(
        'Calculation not found'
      );
    });

    it('should throw error if calculation belongs to different user', async () => {
      const userId = 'user-123';
      const otherUserId = 'user-456';
      const calculationId = 'calc-123';
      const mockCalculation = {
        id: calculationId,
        user_id: otherUserId,
        status_type: 'ИП',
      };

      (prisma.calculation.findUnique as jest.Mock).mockResolvedValue(mockCalculation);

      await expect(service.getCalculation(calculationId, userId)).rejects.toThrow(
        'Calculation not found'
      );
    });
  });

  describe('saveStep', () => {
    it('should save step data', async () => {
      const calculationId = 'calc-123';
      const stepNumber = 1;
      const stepData = { revenue_2025: 1000000, status_type: 'ИП' };
      const mockStep = {
        id: 'step-123',
        calculation_id: calculationId,
        step_number: stepNumber,
        data: JSON.stringify(stepData),
      };

      (prisma.calculationStep.upsert as jest.Mock).mockResolvedValue(mockStep);

      const result = await service.saveStep(calculationId, stepNumber, stepData);

      expect(prisma.calculationStep.upsert).toHaveBeenCalledWith({
        where: {
          calculation_id_step_number: {
            calculation_id: calculationId,
            step_number: stepNumber,
          },
        },
        create: {
          calculation_id: calculationId,
          step_number: stepNumber,
          data: JSON.stringify(stepData),
        },
        update: {
          data: JSON.stringify(stepData),
          completed_at: expect.any(Date),
        },
      });
      expect(result).toEqual(mockStep);
    });

    it('should handle string data', async () => {
      const calculationId = 'calc-123';
      const stepNumber = 1;
      const stepDataString = JSON.stringify({ revenue_2025: 1000000 });

      (prisma.calculationStep.upsert as jest.Mock).mockResolvedValue({});

      await service.saveStep(calculationId, stepNumber, stepDataString);

      expect(prisma.calculationStep.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            data: stepDataString,
          }),
        })
      );
    });
  });

  describe('calculateResults', () => {
    it('should calculate results and update calculation', async () => {
      const calculationId = 'calc-123';
      const mockCalculation = {
        id: calculationId,
        status_type: 'ИП',
        tax_regime: 'УСН 6%',
        revenue_2025: 1000000,
        steps: [
          {
            step_number: 1,
            data: JSON.stringify({ revenue_2025: 1000000, status_type: 'ИП' }),
          },
          {
            step_number: 2,
            data: JSON.stringify({ count_employees: 0, fot_year: 0 }),
          },
          {
            step_number: 3,
            data: JSON.stringify({ applies_nds: false, nds_rate: 0 }),
          },
          {
            step_number: 4,
            data: JSON.stringify({ regime: 'УСН 6%' }),
          },
        ],
      };

      const mockResults = {
        status_type: 'ИП',
        revenue_2025: 1000000,
        tax_2025: { main_tax: 60000, nds_tax: 0, contributions: 0, total: 60000 },
        tax_2026: { main_tax: 60000, nds_tax: 0, contributions: 0, total: 60000 },
        tax_2027: { main_tax: 60000, nds_tax: 0, contributions: 0, total: 60000 },
        tax_2028: { main_tax: 60000, nds_tax: 0, contributions: 0, total: 60000 },
        regime_comparison: [],
        recommended_regime: 'УСН 6%',
        recommended_savings: 0,
      };

      (prisma.calculation.findUnique as jest.Mock).mockResolvedValue(mockCalculation);
      (mockTaxCalcService.calculate as jest.Mock).mockReturnValue(mockResults);
      (prisma.calculation.update as jest.Mock).mockResolvedValue({});

      const result = await service.calculateResults(calculationId);

      expect(prisma.calculation.findUnique).toHaveBeenCalledWith({
        where: { id: calculationId },
        include: { steps: true },
      });

      expect(mockTaxCalcService.calculate).toHaveBeenCalledWith({
        status_type: 'ИП',
        tax_regime: 'УСН 6%',
        revenue_2025: 1000000,
        expenses_2025: 0,
        count_employees: 0,
        fot_year: 0,
        applies_nds: false,
        nds_rate: 0,
        incoming_nds: 0,
      });

      expect(prisma.calculation.update).toHaveBeenCalledWith({
        where: { id: calculationId },
        data: {
          total_tax_2025: 60000,
          total_tax_2026: 60000,
          total_tax_2027: 60000,
          total_tax_2028: 60000,
          recommended_regime: 'УСН 6%',
          recommended_savings: 0,
          status: 'completed',
        },
      });

      expect(result).toEqual(mockResults);
    });

    it('should throw error if calculation not found', async () => {
      const calculationId = 'calc-123';

      (prisma.calculation.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.calculateResults(calculationId)).rejects.toThrow(
        'Calculation not found'
      );
    });

    it('should handle calculation errors', async () => {
      const calculationId = 'calc-123';
      const mockCalculation = {
        id: calculationId,
        status_type: 'ИП',
        tax_regime: 'УСН 6%',
        revenue_2025: 1000000,
        steps: [],
      };

      (prisma.calculation.findUnique as jest.Mock).mockResolvedValue(mockCalculation);
      (mockTaxCalcService.calculate as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid input');
      });

      await expect(service.calculateResults(calculationId)).rejects.toThrow(
        'Ошибка расчета: Invalid input'
      );
    });

    it('should use calculation defaults when steps are missing', async () => {
      const calculationId = 'calc-123';
      const mockCalculation = {
        id: calculationId,
        status_type: 'ООО',
        tax_regime: 'УСН 15%',
        revenue_2025: 5000000,
        steps: [],
      };

      const mockResults = {
        status_type: 'ООО',
        revenue_2025: 5000000,
        tax_2025: { main_tax: 0, nds_tax: 0, contributions: 0, total: 0 },
        tax_2026: { main_tax: 0, nds_tax: 0, contributions: 0, total: 0 },
        tax_2027: { main_tax: 0, nds_tax: 0, contributions: 0, total: 0 },
        tax_2028: { main_tax: 0, nds_tax: 0, contributions: 0, total: 0 },
        regime_comparison: [],
        recommended_regime: 'УСН 15%',
        recommended_savings: 0,
      };

      (prisma.calculation.findUnique as jest.Mock).mockResolvedValue(mockCalculation);
      (mockTaxCalcService.calculate as jest.Mock).mockReturnValue(mockResults);
      (prisma.calculation.update as jest.Mock).mockResolvedValue({});

      await service.calculateResults(calculationId);

      expect(mockTaxCalcService.calculate).toHaveBeenCalledWith({
        status_type: 'ООО',
        tax_regime: 'УСН 15%',
        revenue_2025: 5000000,
        expenses_2025: 0,
        count_employees: 0,
        fot_year: 0,
        applies_nds: false,
        nds_rate: 0,
        incoming_nds: 0,
      });
    });
  });
});
