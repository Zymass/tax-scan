import { prisma } from '../db';
import { TaxCalculatorService } from './tax-calculator.service';

export class CalculationsService {
  private taxCalcService = new TaxCalculatorService();

  async createCalculation(userId: string) {
    // Проверяем пользователя (без ограничения лимита, но ведем счет)
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Создаем расчет без проверки лимита (ограничение временно отключено)
    return await prisma.calculation.create({
      data: {
        user_id: userId,
        status_type: 'ИП',
        tax_regime: 'УСН 6%',
        revenue_2025: 0,
        total_tax_2025: 0,
        total_tax_2026: 0,
        total_tax_2027: 0,
        total_tax_2028: 0
      }
    });
  }

  async getCalculations(userId: string, limit: number = 10, offset: number = 0) {
    return await prisma.calculation.findMany({
      where: {
        user_id: userId,
        deleted_at: null
      },
      skip: offset,
      take: limit,
      orderBy: { created_at: 'desc' }
    });
  }

  async getCalculation(id: string, userId?: string) {
    const calculation = await prisma.calculation.findUnique({
      where: { id },
      include: { steps: true, actions: true }
    });

    if (!calculation) {
      throw new Error('Calculation not found');
    }

    // Если userId не указан (неавторизованный), разрешаем доступ
    // Если userId указан, проверяем что расчет принадлежит пользователю
    if (userId && calculation.user_id !== userId) {
      throw new Error('Calculation not found');
    }

    return calculation;
  }

  async saveStep(calculationId: string, stepNumber: number, data: any) {
    return await prisma.calculationStep.upsert({
      where: {
        calculation_id_step_number: {
          calculation_id: calculationId,
          step_number: stepNumber
        }
      },
      create: {
        calculation_id: calculationId,
        step_number: stepNumber,
        data: typeof data === 'string' ? data : JSON.stringify(data)
      },
      update: {
        data: typeof data === 'string' ? data : JSON.stringify(data),
        completed_at: new Date()
      }
    });
  }

  async calculateResults(calculationId: string) {
    const calculation = await prisma.calculation.findUnique({
      where: { id: calculationId },
      include: { steps: true }
    });

    if (!calculation) {
      throw new Error('Calculation not found');
    }

    const parseStepData = (data: string | null) => {
      if (!data) return {};
      try {
        return typeof data === 'string' ? JSON.parse(data) : data;
      } catch {
        return {};
      }
    };

    const step1Data = parseStepData(calculation.steps.find(s => s.step_number === 1)?.data || null);
    const step2Data = parseStepData(calculation.steps.find(s => s.step_number === 2)?.data || null);
    const step3Data = parseStepData(calculation.steps.find(s => s.step_number === 3)?.data || null);
    const step4Data = parseStepData(calculation.steps.find(s => s.step_number === 4)?.data || null);

    let results;
    try {
      results = this.taxCalcService.calculate({
        status_type: step1Data.status_type || calculation.status_type,
        tax_regime: step4Data.regime || step1Data.tax_regime || calculation.tax_regime,
        revenue_2025: Number(step1Data.revenue_2025 || calculation.revenue_2025),
        expenses_2025: Number(step1Data.expenses_2025 || 0),
        count_employees: Number(step2Data.count_employees || 0),
        fot_year: Number(step2Data.fot_year || 0),
        applies_nds: step3Data.applies_nds || false,
        nds_rate: Number(step3Data.nds_rate || 0),
        incoming_nds: Number(step3Data.incoming_nds || 0)
      });
    } catch (error: any) {
      if (error instanceof Error) {
        throw new Error(`Ошибка расчета: ${error.message}`);
      }
      throw error;
    }

    await prisma.calculation.update({
      where: { id: calculationId },
      data: {
        total_tax_2025: results.tax_2025.total,
        total_tax_2026: results.tax_2026.total,
        total_tax_2027: results.tax_2027.total,
        total_tax_2028: results.tax_2028.total,
        recommended_regime: results.recommended_regime,
        recommended_savings: results.recommended_savings,
        status: 'completed'
      }
    });

    return results;
  }
}
