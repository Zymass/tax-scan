import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiClient {
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

    // Handle token refresh
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

  // Auth endpoints
  register(email: string, password: string, name: string, phone?: string) {
    return this.client.post('/auth/register', { email, password, name, phone });
  }

  login(email: string, password: string) {
    return this.client.post('/auth/login', { email, password });
  }

  logout() {
    return this.client.post('/auth/logout');
  }

  // Get current user info (if needed)
  getMe() {
    return this.client.get('/auth/me');
  }

  // Calculation endpoints
  createCalculation() {
    return this.client.post('/calculations');
  }

  getCalculation(id: string) {
    return this.client.get(`/calculations/${id}`);
  }

  getCalculations(limit = 10, offset = 0) {
    return this.client.get('/calculations', { params: { limit, offset } });
  }

  saveCalculationStep(id: string, step: number, data: any) {
    return this.client.put(`/calculations/${id}/step${step}`, data);
  }

  calculateResults(id: string) {
    return this.client.post(`/calculations/${id}/calculate`);
  }

  createScenario(id: string, scenarioName: string, scenarioData: any) {
    return this.client.post(`/calculations/${id}/scenarios`, {
      scenario_name: scenarioName,
      scenario_data: scenarioData
    });
  }

  getScenarios(id: string) {
    return this.client.get(`/calculations/${id}/scenarios`);
  }

  exportPdf(id: string) {
    return this.client.get(`/calculations/${id}/pdf`, { responseType: 'blob' });
  }

  sendEmail(id: string, email: string) {
    return this.client.post(`/calculations/${id}/email`, { email });
  }

  // Action plans
  getActionPlan(id: string) {
    return this.client.get(`/calculations/${id}/actions`);
  }

  updateAction(id: string, actionId: string, completed: boolean) {
    return this.client.put(`/calculations/${id}/actions/${actionId}`, { completed });
  }
}

export const apiClient = new ApiClient();
