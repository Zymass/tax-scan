import { useState, useCallback } from 'react';
import { apiClient } from '../services/api';
import { CalculationData } from '../types';

export const useCalculation = () => {
  const [calculation, setCalculation] = useState<any>(null);
  const [results, setResults] = useState<CalculationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загружаем расчет по ID
  const loadCalculation = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const response = await apiClient.getCalculation(id);
      setCalculation(response.data);
      setError(null);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error loading calculation');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.createCalculation();
      setCalculation(response.data);
      setError(null);
      return response.data.id;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error creating calculation');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveStep = useCallback(async (id: string, step: number, data: any) => {
    setLoading(true);
    try {
      const response = await apiClient.saveCalculationStep(id, step, data);
      setCalculation(response.data);
      setError(null);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error saving step');
    } finally {
      setLoading(false);
    }
  }, []);

  const calculate = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const response = await apiClient.calculateResults(id);
      setResults(response.data);
      setError(null);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error calculating results');
    } finally {
      setLoading(false);
    }
  }, []);

  const exportPdf = useCallback(async (id: string) => {
    try {
      const response = await apiClient.exportPdf(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `calculation-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link?.parentNode?.removeChild(link);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error exporting PDF');
    }
  }, []);

  return {
    calculation,
    results,
    loading,
    error,
    create,
    saveStep,
    calculate,
    exportPdf,
    loadCalculation
  };
};
