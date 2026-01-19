import { Request, Response } from 'express';
import { CalculationsController } from '../calculations.controller';
import { CalculationsService } from '../../services/calculations.service';
import { generatePdf, generateCalculationHtml } from '../../utils/pdf-generator';
import { prisma } from '../../db';

jest.mock('../../services/calculations.service');
jest.mock('../../utils/pdf-generator', () => ({
  generatePdf: jest.fn(),
  generateCalculationHtml: jest.fn(),
}));
jest.mock('../../db', () => ({
  prisma: {
    calculation: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('CalculationsController', () => {
  let controller: CalculationsController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockCalculationsService: jest.Mocked<CalculationsService>;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new CalculationsController();
    mockCalculationsService = (controller as any).calculationsService as jest.Mocked<CalculationsService>;

    mockRequest = {
      userId: 'user-123',
      params: {},
      query: {},
      body: {},
    };

    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe('create', () => {
    it('should create a new calculation', async () => {
      const mockCalculation = {
        id: 'calc-123',
        user_id: 'user-123',
        status_type: 'ИП',
        tax_regime: 'УСН 6%',
        created_at: new Date(),
      };

      mockCalculationsService.createCalculation = jest.fn().mockResolvedValue(mockCalculation);

      await controller.create(mockRequest as Request, mockResponse as Response);

      expect(mockCalculationsService.createCalculation).toHaveBeenCalledWith('user-123');
      expect(mockResponse.json).toHaveBeenCalledWith({
        ...mockCalculation,
        current_step: 1,
      });
    });

    it('should create demo user if userId is not provided', async () => {
      mockRequest.userId = undefined;
      const mockDemoUser = { id: 'demo-user-123', email: 'demo@taxcalculator.local' };
      const mockCalculation = { id: 'calc-123', user_id: 'demo-user-123' };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockDemoUser);
      mockCalculationsService.createCalculation = jest.fn().mockResolvedValue(mockCalculation);

      await controller.create(mockRequest as Request, mockResponse as Response);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'demo@taxcalculator.local' },
      });
      expect(mockCalculationsService.createCalculation).toHaveBeenCalledWith('demo-user-123');
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      mockCalculationsService.createCalculation = jest.fn().mockRejectedValue(error);

      await controller.create(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Database error' });
    });
  });

  describe('getAll', () => {
    it('should fetch all calculations for a user', async () => {
      const mockCalculations = [
        { id: 'calc-1', user_id: 'user-123' },
        { id: 'calc-2', user_id: 'user-123' },
      ];

      mockCalculationsService.getCalculations = jest.fn().mockResolvedValue(mockCalculations);

      await controller.getAll(mockRequest as Request, mockResponse as Response);

      expect(mockCalculationsService.getCalculations).toHaveBeenCalledWith('user-123', 10, 0);
      expect(mockResponse.json).toHaveBeenCalledWith(mockCalculations);
    });

    it('should respect limit and offset query parameters', async () => {
      mockRequest.query = { limit: '5', offset: '10' };
      mockCalculationsService.getCalculations = jest.fn().mockResolvedValue([]);

      await controller.getAll(mockRequest as Request, mockResponse as Response);

      expect(mockCalculationsService.getCalculations).toHaveBeenCalledWith('user-123', 5, 10);
    });

    it('should cap limit at 100', async () => {
      mockRequest.query = { limit: '200' };
      mockCalculationsService.getCalculations = jest.fn().mockResolvedValue([]);

      await controller.getAll(mockRequest as Request, mockResponse as Response);

      expect(mockCalculationsService.getCalculations).toHaveBeenCalledWith('user-123', 100, 0);
    });
  });

  describe('getOne', () => {
    it('should fetch a calculation by id', async () => {
      const mockCalculation = {
        id: 'calc-123',
        user_id: 'user-123',
        status_type: 'ИП',
      };

      mockRequest.params = { id: 'calc-123' };
      mockCalculationsService.getCalculation = jest.fn().mockResolvedValue(mockCalculation);

      await controller.getOne(mockRequest as Request, mockResponse as Response);

      expect(mockCalculationsService.getCalculation).toHaveBeenCalledWith('calc-123', 'user-123');
      expect(mockResponse.json).toHaveBeenCalledWith(mockCalculation);
    });

    it('should return 404 if calculation not found', async () => {
      mockRequest.params = { id: 'calc-123' };
      mockCalculationsService.getCalculation = jest.fn().mockRejectedValue(new Error('Calculation not found'));

      await controller.getOne(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Calculation not found' });
    });
  });

  describe('step1', () => {
    it('should save step 1 data', async () => {
      mockRequest.params = { id: 'calc-123' };
      mockRequest.body = {
        status_type: 'ИП',
        tax_regime: 'УСН 6%',
        revenue_2025: 1000000,
        expenses_2025: 0,
        region_code: '77',
      };

      const mockCalculation = { id: 'calc-123', current_step: 2 };
      (prisma.calculation.update as jest.Mock).mockResolvedValue(mockCalculation);
      (prisma.calculation.findUnique as jest.Mock).mockResolvedValue(mockCalculation);
      mockCalculationsService.saveStep = jest.fn().mockResolvedValue({});

      await controller.step1(mockRequest as Request, mockResponse as Response);

      expect(prisma.calculation.update).toHaveBeenCalledWith({
        where: { id: 'calc-123' },
        data: {
          status_type: 'ИП',
          tax_regime: 'УСН 6%',
          revenue_2025: 1000000,
          region_code: '77',
          current_step: 2,
        },
      });
      expect(mockCalculationsService.saveStep).toHaveBeenCalledWith('calc-123', 1, {
        status_type: 'ИП',
        tax_regime: 'УСН 6%',
        revenue_2025: 1000000,
        expenses_2025: 0,
        region_code: '77',
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockCalculation);
    });
  });

  describe('calculate', () => {
    it('should calculate results', async () => {
      mockRequest.params = { id: 'calc-123' };
      const mockResults = {
        tax_2025: { total: 60000 },
        tax_2026: { total: 60000 },
        tax_2027: { total: 60000 },
        tax_2028: { total: 60000 },
        recommended_regime: 'УСН 6%',
      };

      mockCalculationsService.calculateResults = jest.fn().mockResolvedValue(mockResults);

      await controller.calculate(mockRequest as Request, mockResponse as Response);

      expect(mockCalculationsService.calculateResults).toHaveBeenCalledWith('calc-123');
      expect(mockResponse.json).toHaveBeenCalledWith(mockResults);
    });

    it('should handle calculation errors', async () => {
      mockRequest.params = { id: 'calc-123' };
      mockCalculationsService.calculateResults = jest.fn().mockRejectedValue(new Error('Invalid input'));

      await controller.calculate(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid input' });
    });
  });

  describe('getPdf', () => {
    it('should generate PDF with all years data', async () => {
      mockRequest.params = { id: 'calc-123' };
      const mockCalculation = {
        id: 'calc-123',
        user_id: 'user-123',
        status_type: 'ИП',
        tax_regime: 'УСН 6%',
        revenue_2025: 1000000,
      };

      const mockResults = {
        tax_2025: { main_tax: 60000, nds_tax: 0, contributions: 0, total: 60000 },
        tax_2026: { main_tax: 60000, nds_tax: 0, contributions: 0, total: 60000 },
        tax_2027: { main_tax: 60000, nds_tax: 0, contributions: 0, total: 60000 },
        tax_2028: { main_tax: 60000, nds_tax: 0, contributions: 0, total: 60000 },
        recommended_regime: 'УСН 6%',
        recommended_savings: 0,
      };

      const mockPdfBuffer = Buffer.from('PDF content');
      const mockHtmlContent = '<html>PDF HTML</html>';

      mockCalculationsService.getCalculation = jest.fn().mockResolvedValue(mockCalculation);
      mockCalculationsService.calculateResults = jest.fn().mockResolvedValue(mockResults);
      (generateCalculationHtml as jest.Mock).mockReturnValue(mockHtmlContent);
      (generatePdf as jest.Mock).mockResolvedValue(mockPdfBuffer);

      mockResponse.setHeader = jest.fn();
      mockResponse.send = jest.fn();

      await controller.getPdf(mockRequest as Request, mockResponse as Response);

      expect(mockCalculationsService.getCalculation).toHaveBeenCalledWith('calc-123', 'user-123');
      expect(mockCalculationsService.calculateResults).toHaveBeenCalledWith('calc-123');
      expect(generateCalculationHtml).toHaveBeenCalledWith(
        expect.objectContaining({
          tax_2025: mockResults.tax_2025,
          tax_2026: mockResults.tax_2026,
          tax_2027: mockResults.tax_2027,
          tax_2028: mockResults.tax_2028,
        })
      );
      expect(generatePdf).toHaveBeenCalledWith(mockHtmlContent);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(mockResponse.send).toHaveBeenCalledWith(mockPdfBuffer);
    });

    it('should include tax_2027 and tax_2028 in PDF data', async () => {
      mockRequest.params = { id: 'calc-123' };
      const mockCalculation = { id: 'calc-123', user_id: 'user-123' };
      const mockResults = {
        tax_2025: { main_tax: 0, nds_tax: 0, contributions: 0, total: 0 },
        tax_2026: { main_tax: 0, nds_tax: 0, contributions: 0, total: 0 },
        tax_2027: { main_tax: 50000, nds_tax: 0, contributions: 0, total: 50000 },
        tax_2028: { main_tax: 60000, nds_tax: 0, contributions: 0, total: 60000 },
        recommended_regime: 'УСН 6%',
        recommended_savings: 0,
      };

      mockCalculationsService.getCalculation = jest.fn().mockResolvedValue(mockCalculation);
      mockCalculationsService.calculateResults = jest.fn().mockResolvedValue(mockResults);
      (generateCalculationHtml as jest.Mock).mockReturnValue('<html>PDF HTML</html>');
      (generatePdf as jest.Mock).mockResolvedValue(Buffer.from('PDF'));

      mockResponse.setHeader = jest.fn();
      mockResponse.send = jest.fn();

      await controller.getPdf(mockRequest as Request, mockResponse as Response);

      expect(generateCalculationHtml).toHaveBeenCalledWith(
        expect.objectContaining({
          tax_2027: mockResults.tax_2027,
          tax_2028: mockResults.tax_2028,
        })
      );
    });

    it('should handle missing calculation results', async () => {
      mockRequest.params = { id: 'calc-123' };
      const mockCalculation = { id: 'calc-123', user_id: 'user-123' };

      mockCalculationsService.getCalculation = jest.fn().mockResolvedValue(mockCalculation);
      mockCalculationsService.calculateResults = jest.fn().mockResolvedValue(null);

      mockResponse.status = jest.fn().mockReturnThis();

      await controller.getPdf(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });
});
