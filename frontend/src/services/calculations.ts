import axios, { AxiosInstance } from 'axios';
import { Calculation, CalculationData } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class CalculationsService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async createCalculation(): Promise<Calculation> {
    const response = await this.client.post<Calculation>('/calculations');
    return response.data;
  }

  async getCalculation(id: string): Promise<Calculation> {
    const response = await this.client.get<Calculation>(`/calculations/${id}`);
    return response.data;
  }

  async getCalculations(limit = 10, offset = 0): Promise<Calculation[]> {
    const response = await this.client.get<Calculation[]>('/calculations', {
      params: { limit, offset }
    });
    return response.data;
  }

  async saveCalculationStep(id: string, step: number, data: any): Promise<Calculation> {
    const response = await this.client.put<Calculation>(`/calculations/${id}/step${step}`, data);
    return response.data;
  }

  async calculateResults(id: string): Promise<CalculationData> {
    const response = await this.client.post<CalculationData>(`/calculations/${id}/calculate`);
    return response.data;
  }

  async createScenario(id: string, scenarioName: string, scenarioData: any): Promise<any> {
    const response = await this.client.post(`/calculations/${id}/scenarios`, {
      scenario_name: scenarioName,
      scenario_data: scenarioData
    });
    return response.data;
  }

  async getScenarios(id: string): Promise<any[]> {
    const response = await this.client.get(`/calculations/${id}/scenarios`);
    return response.data;
  }

  async exportPdf(id: string): Promise<Blob> {
    const response = await this.client.get(`/calculations/${id}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async sendEmail(id: string, email: string): Promise<void> {
    await this.client.post(`/calculations/${id}/email`, { email });
  }

  async getActionPlan(id: string): Promise<any[]> {
    const response = await this.client.get(`/calculations/${id}/actions`);
    return response.data;
  }

  async updateAction(id: string, actionId: string, completed: boolean): Promise<void> {
    await this.client.put(`/calculations/${id}/actions/${actionId}`, { completed });
  }

  async deleteCalculation(id: string): Promise<void> {
    await this.client.delete(`/calculations/${id}`);
  }
}

export const calculationsService = new CalculationsService();
