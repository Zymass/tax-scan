import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class PaymentService {
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
  }

  async createPayment(calculationsCount: number) {
    const response = await this.client.post('/payment/create', {
      calculationsCount
    });
    return response.data;
  }

  async getPaymentStatus(paymentId: string) {
    const response = await this.client.get(`/payment/status/${paymentId}`);
    return response.data;
  }

  async getPaymentHistory() {
    const response = await this.client.get('/payment/history');
    return response.data;
  }
}

export const paymentService = new PaymentService();
