import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Auth endpoints
  login: (email: string, password: string) =>
    api.post('/login', { email, password }),
  
  register: (userData: { nom: string; prenom: string; email: string; password: string }) =>
    api.post('/register', userData),
  
  logout: () => api.post('/logout'),
  
  getCurrentUser: () => api.get('/user'),

  // Client endpoints
  getProfile: () => api.get('/profile'),
  
  getTransactions: (page = 1, limit = 10) =>
    api.get('/transactions', { params: { page, limit } }),
  
  createTransaction: (data: {
    type: 'credit' | 'debit' | 'payment';
    montant: number;
    description: string;
  }) => api.post('/transactions', data),
  
  payCredit: (montant: number) =>
    api.post('/pay-credit', { montant }),

  // Admin endpoints
  getAllClients: () => api.get('/admin/clients'),
  
  getDailyReport: (date?: string) =>
    api.get('/admin/daily-report', { params: { date } }),
  
  getMonthlyReport: (month?: string, year?: number) =>
    api.get('/admin/monthly-report', { params: { month, year } }),
  
  getClientDetails: (clientId: number) =>
    api.get(`/admin/clients/${clientId}`),

  // Utility methods
  setAuthToken: (token: string | null) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  },
};

export default api;