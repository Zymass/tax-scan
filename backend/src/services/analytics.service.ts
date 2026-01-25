import { prisma } from '../db';

export interface AnalyticsStats {
  totalUsers: number;
  newUsers: number; // за период
  totalCalculations: number;
  newCalculations: number; // за период
  completedCalculations: number;
  calculationsByPeriod: {
    date: string;
    count: number;
  }[];
  usersByPeriod: {
    date: string;
    count: number;
  }[];
  calculationsByStatus: {
    status: string;
    count: number;
  }[];
  calculationsByRegime: {
    regime: string;
    count: number;
  }[];
}

export class AnalyticsService {
  async getStats(startDate?: Date, endDate?: Date): Promise<AnalyticsStats> {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // По умолчанию 30 дней
    const end = endDate || new Date();

    // Общее количество пользователей
    const totalUsers = await prisma.user.count({
      where: {
        deleted_at: null
      }
    });

    // Новые пользователи за период
    const newUsers = await prisma.user.count({
      where: {
        created_at: {
          gte: start,
          lte: end
        },
        deleted_at: null
      }
    });

    // Общее количество расчетов
    const totalCalculations = await prisma.calculation.count({
      where: {
        deleted_at: null
      }
    });

    // Новые расчеты за период
    const newCalculations = await prisma.calculation.count({
      where: {
        created_at: {
          gte: start,
          lte: end
        },
        deleted_at: null
      }
    });

    // Завершенные расчеты
    const completedCalculations = await prisma.calculation.count({
      where: {
        status: 'completed',
        deleted_at: null
      }
    });

    // Расчеты по дням за период
    const calculationsByPeriod = await this.getCalculationsByPeriod(start, end);

    // Пользователи по дням за период
    const usersByPeriod = await this.getUsersByPeriod(start, end);

    // Расчеты по статусам
    const calculationsByStatus = await prisma.calculation.groupBy({
      by: ['status'],
      where: {
        deleted_at: null
      },
      _count: {
        id: true
      }
    });

    // Расчеты по налоговым режимам
    const calculationsByRegime = await prisma.calculation.groupBy({
      by: ['tax_regime'],
      where: {
        deleted_at: null
      },
      _count: {
        id: true
      }
    });

    return {
      totalUsers,
      newUsers,
      totalCalculations,
      newCalculations,
      completedCalculations,
      calculationsByPeriod,
      usersByPeriod,
      calculationsByStatus: calculationsByStatus.map(item => ({
        status: item.status,
        count: item._count.id
      })),
      calculationsByRegime: calculationsByRegime.map(item => ({
        regime: item.tax_regime,
        count: item._count.id
      }))
    };
  }

  private async getCalculationsByPeriod(start: Date, end: Date) {
    const calculations = await prisma.calculation.findMany({
      where: {
        created_at: {
          gte: start,
          lte: end
        },
        deleted_at: null
      },
      select: {
        created_at: true
      },
      orderBy: {
        created_at: 'asc'
      }
    });

    // Группируем по дням
    const grouped = new Map<string, number>();
    calculations.forEach(calc => {
      const date = calc.created_at.toISOString().split('T')[0];
      grouped.set(date, (grouped.get(date) || 0) + 1);
    });

    // Заполняем пропущенные дни нулями
    const result: { date: string; count: number }[] = [];
    const current = new Date(start);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        count: grouped.get(dateStr) || 0
      });
      current.setDate(current.getDate() + 1);
    }

    return result;
  }

  private async getUsersByPeriod(start: Date, end: Date) {
    const users = await prisma.user.findMany({
      where: {
        created_at: {
          gte: start,
          lte: end
        },
        deleted_at: null
      },
      select: {
        created_at: true
      },
      orderBy: {
        created_at: 'asc'
      }
    });

    // Группируем по дням
    const grouped = new Map<string, number>();
    users.forEach(user => {
      const date = user.created_at.toISOString().split('T')[0];
      grouped.set(date, (grouped.get(date) || 0) + 1);
    });

    // Заполняем пропущенные дни нулями
    const result: { date: string; count: number }[] = [];
    const current = new Date(start);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        count: grouped.get(dateStr) || 0
      });
      current.setDate(current.getDate() + 1);
    }

    return result;
  }
}
