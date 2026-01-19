import { useState, useCallback } from 'react';
import { calculationsService } from '../services/calculations';
import { Calculation, CalculationData } from '../types';

export const useTaxCalculations = () => {
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [currentCalculation, setCurrentCalculation] = useState<Calculation | null>(null);
  const [results, setResults] = useState<CalculationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCalculations = useCallback(async (limit = 10, offset = 0) => {
    setLoading(true);
    setError(null);
    try {
      const data = await calculationsService.getCalculations(limit, offset);
      setCalculations(data);
      return data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Ошибка загрузки расчетов';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCalculation = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await calculationsService.getCalculation(id);
      setCurrentCalculation(data);
      return data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Ошибка загрузки расчета';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createCalculation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await calculationsService.createCalculation();
      setCurrentCalculation(data);
      setCalculations(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Ошибка создания расчета';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateResults = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await calculationsService.calculateResults(id);
      setResults(data);
      return data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Ошибка расчета';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCalculation = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await calculationsService.deleteCalculation(id);
      setCalculations(prev => prev.filter(calc => calc.id !== id));
      if (currentCalculation?.id === id) {
        setCurrentCalculation(null);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Ошибка удаления';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentCalculation]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    calculations,
    currentCalculation,
    results,
    loading,
    error,
    loadCalculations,
    loadCalculation,
    createCalculation,
    calculateResults,
    deleteCalculation,
    clearError
  };
};
