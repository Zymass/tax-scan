import { Request, Response } from 'express';
import { CalculationsService } from '../services/calculations.service';
import { generatePdf, generateCalculationHtml } from '../utils/pdf-generator';
import { sendEmail } from '../services/email.service';
import { prisma } from '../db';

export class CalculationsController {
  private calculationsService = new CalculationsService();

  async create(req: Request, res: Response) {
    try {
      // Use userId if provided, otherwise create demo user
      const userId = req.userId || await this.getOrCreateDemoUser();
      const calculation = await this.calculationsService.createCalculation(userId);
      res.json({ ...calculation, current_step: 1 });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async getOrCreateDemoUser(): Promise<string> {
    const demoEmail = 'demo@taxcalculator.local';
    let user = await prisma.user.findUnique({
      where: { email: demoEmail }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: demoEmail,
          password_hash: 'demo',
          name: 'Demo User'
        }
      });
    }

    return user.id;
  }

  async getAll(req: Request, res: Response) {
    try {
      const userId = req.userId || await this.getOrCreateDemoUser();
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
      const offset = parseInt(req.query.offset as string) || 0;
      const calculations = await this.calculationsService.getCalculations(userId, limit, offset);
      res.json(calculations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getOne(req: Request, res: Response) {
    try {
      const userId = req.userId || await this.getOrCreateDemoUser();
      const { id } = req.params;
      const calculation = await this.calculationsService.getCalculation(id, userId);
      res.json(calculation);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  async step1(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status_type, tax_regime, revenue_2025, expenses_2025, region_code } = req.body;

      await prisma.calculation.update({
        where: { id },
        data: {
          status_type,
          tax_regime,
          revenue_2025,
          region_code,
          current_step: 2
        }
      });

      await this.calculationsService.saveStep(id, 1, {
        status_type,
        tax_regime,
        revenue_2025,
        expenses_2025,
        region_code
      });

      const calculation = await prisma.calculation.findUnique({ where: { id } });
      res.json(calculation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async step2(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.calculationsService.saveStep(id, 2, req.body);
      await prisma.calculation.update({
        where: { id },
        data: { current_step: 3 }
      });
      const calculation = await prisma.calculation.findUnique({ where: { id } });
      res.json(calculation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async step3(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.calculationsService.saveStep(id, 3, req.body);
      await prisma.calculation.update({
        where: { id },
        data: { current_step: 4 }
      });
      const calculation = await prisma.calculation.findUnique({ where: { id } });
      res.json(calculation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async step4(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.calculationsService.saveStep(id, 4, req.body);
      await prisma.calculation.update({
        where: { id },
        data: { current_step: 5 }
      });
      const calculation = await prisma.calculation.findUnique({ where: { id } });
      res.json(calculation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async calculate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const results = await this.calculationsService.calculateResults(id);
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getPdf(req: Request, res: Response) {
    try {
      const userId = req.userId || await this.getOrCreateDemoUser();
      const { id } = req.params;
      
      console.log(`[PDF] Starting PDF generation for calculation ${id}`);
      
      const calculation = await this.calculationsService.getCalculation(id, userId);
      if (!calculation) {
        throw new Error('Calculation not found');
      }
      console.log(`[PDF] Calculation loaded:`, { id, status: calculation.status });
      
      // Recalculate results to get full tax breakdown for PDF
      console.log(`[PDF] Recalculating results...`);
      let results;
      try {
        results = await this.calculationsService.calculateResults(id);
        console.log(`[PDF] Results calculated successfully`);
      } catch (calcError: any) {
        console.error(`[PDF] Error calculating results:`, calcError);
        throw new Error(`Failed to calculate results: ${calcError.message}`);
      }
      
      if (!results || !results.tax_2025 || !results.tax_2026) {
        throw new Error('Invalid calculation results');
      }
      
      // Combine calculation data with results for PDF
      const pdfData = {
        ...calculation,
        tax_2025: results.tax_2025 || { main_tax: 0, nds_tax: 0, contributions: 0, total: 0 },
        tax_2026: results.tax_2026 || { main_tax: 0, nds_tax: 0, contributions: 0, total: 0 },
        tax_2027: results.tax_2027 || { main_tax: 0, nds_tax: 0, contributions: 0, total: 0 },
        tax_2028: results.tax_2028 || { main_tax: 0, nds_tax: 0, contributions: 0, total: 0 },
        recommended_regime: results.recommended_regime || 'Не указан',
        recommended_savings: results.recommended_savings || 0,
        recommendation: `Рекомендуемый режим: ${results.recommended_regime || 'Не указан'}. Экономия: ${(results.recommended_savings || 0).toLocaleString('ru-RU')} ₽`
      };
      
      console.log(`[PDF] Generating HTML content...`);
      const htmlContent = generateCalculationHtml(pdfData);
      if (!htmlContent || htmlContent.length === 0) {
        throw new Error('Failed to generate HTML content');
      }
      console.log(`[PDF] HTML content generated, length: ${htmlContent.length}`);
      
      console.log(`[PDF] Generating PDF with Puppeteer...`);
      let pdf: Buffer;
      try {
        pdf = await generatePdf(htmlContent);
        if (!pdf || pdf.length === 0) {
          throw new Error('Generated PDF is empty');
        }
        console.log(`[PDF] PDF generated successfully, size: ${pdf.length} bytes`);
      } catch (puppeteerError: any) {
        console.error(`[PDF] Puppeteer error:`, puppeteerError);
        throw new Error(`PDF generation failed: ${puppeteerError.message}. Make sure Puppeteer dependencies are installed.`);
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="tax-calculation-${id}.pdf"`);
      res.send(pdf);
    } catch (error: any) {
      console.error('[PDF] Error generating PDF:', error);
      console.error('[PDF] Error stack:', error.stack);
      const errorMessage = error.message || 'Failed to generate PDF';
      res.status(500).json({ 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  async sendEmail(req: Request, res: Response) {
    try {
      const userId = req.userId || await this.getOrCreateDemoUser();
      const { id } = req.params;
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const calculation = await this.calculationsService.getCalculation(id, userId);
      
      // Получаем результаты расчета для более полной информации
      let results;
      try {
        results = await this.calculationsService.calculateResults(id);
      } catch (e) {
        // Если расчет еще не выполнен, используем только данные из calculation
        results = null;
      }

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #0284C7; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f0f0f0; }
            .total { font-weight: bold; background-color: #fffacd; }
          </style>
        </head>
        <body>
          <h1>Результаты расчета налоговой нагрузки</h1>
          
          <h2>Входные данные</h2>
          <p><strong>Статус:</strong> ${calculation.status_type || 'N/A'}</p>
          <p><strong>Выручка 2025:</strong> ${calculation.revenue_2025?.toLocaleString('ru-RU') || '0'} ₽</p>
          <p><strong>Текущая система:</strong> ${calculation.tax_regime || 'N/A'}</p>
          
          <h2>Налоговая нагрузка</h2>
          <table>
            <tr>
              <th>Год</th>
              <th>Сумма налогов</th>
            </tr>
            <tr>
              <td>2025 (факт)</td>
              <td>${calculation.total_tax_2025?.toLocaleString('ru-RU') || '0'} ₽</td>
            </tr>
            <tr>
              <td>2026 (прогноз)</td>
              <td>${calculation.total_tax_2026?.toLocaleString('ru-RU') || '0'} ₽</td>
            </tr>
          </table>
          
          ${results ? `
          <h2>Детализация</h2>
          <h3>2025 год</h3>
          <ul>
            <li>Основной налог: ${results.tax_2025.main_tax?.toLocaleString('ru-RU') || '0'} ₽</li>
            <li>НДС: ${results.tax_2025.nds_tax?.toLocaleString('ru-RU') || '0'} ₽</li>
            <li>Взносы: ${results.tax_2025.contributions?.toLocaleString('ru-RU') || '0'} ₽</li>
            <li><strong>Итого: ${results.tax_2025.total?.toLocaleString('ru-RU') || '0'} ₽</strong></li>
          </ul>
          
          <h3>2026 год</h3>
          <ul>
            <li>Основной налог: ${results.tax_2026.main_tax?.toLocaleString('ru-RU') || '0'} ₽</li>
            <li>НДС: ${results.tax_2026.nds_tax?.toLocaleString('ru-RU') || '0'} ₽</li>
            <li>Взносы: ${results.tax_2026.contributions?.toLocaleString('ru-RU') || '0'} ₽</li>
            <li><strong>Итого: ${results.tax_2026.total?.toLocaleString('ru-RU') || '0'} ₽</strong></li>
          </ul>
          
          <h2>Рекомендация</h2>
          <p><strong>Рекомендуемый режим:</strong> ${results.recommended_regime || 'N/A'}</p>
          <p><strong>Потенциальная экономия:</strong> ${results.recommended_savings?.toLocaleString('ru-RU') || '0'} ₽</p>
          ` : ''}
          
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            Это автоматическое письмо от Налогового калькулятора 2026
          </p>
        </body>
        </html>
      `;

      await sendEmail(email, 'Результаты расчета налоговой нагрузки', emailHtml);

      res.json({ success: true, message: 'Email sent successfully' });
    } catch (error: any) {
      console.error('Error sending email:', error);
      res.status(500).json({ error: error.message || 'Failed to send email' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.calculation.update({
        where: { id },
        data: { deleted_at: new Date() }
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createScenario(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { scenario_name, scenario_data } = req.body;
      
      const scenario = await prisma.scenario.create({
        data: {
          calculation_id: id,
          scenario_name,
          scenario_data: typeof scenario_data === 'string' ? scenario_data : JSON.stringify(scenario_data),
          result_total_tax: 0,
          result_delta: 0
        }
      });

      res.json(scenario);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getScenarios(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const scenarios = await prisma.scenario.findMany({
        where: { calculation_id: id }
      });
      res.json(scenarios);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
