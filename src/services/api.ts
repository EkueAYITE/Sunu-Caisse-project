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
    const isLoginRequest = error.config?.url?.includes('/auth/login');

    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const apiService = {
/*
  testConnection: async () => {
    try {
      // Test de l'endpoint de base
      const healthCheck = await api.get('/health');
      console.log('✅ Backend accessible:', healthCheck.status);

      // Test des routes auth
      const authRoutes = ['/login', '/auth/login', '/auth/signin'];
      for (const route of authRoutes) {
        try {
          await api.post(route, { test: true });
        } catch (error) {
          console.log(`Route ${route}:`, error.response?.status || 'non accessible');
        }
      }
    } catch (error) {
      console.error('❌ Backend non accessible:', error);
    }
  },

 */

  // Auth endpoints
  login: async (email: string, motDePasse: string) => {
    try {
      console.log('Tentative de connexion avec:', { email, motDePasse: '***' });
      const response = await api.post('/auth/login', {
        email,
        mot_de_passe: motDePasse // Utiliser mot_de_passe au lieu de password
      });
      console.log('Réponse de connexion:', response.data);
      return response;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error('Erreur de connexion:', error.response?.data || error.message);
      } else {
        console.error('Erreur de connexion inconnue:', error);
      }
      throw error;
    }
  },

  // Modifier la méthode register
  register: (userData: { nom: string; prenom: string; email: string; motDePasse: string }) =>
      api.post('/auth/register', {
        nom: userData.nom,
        prenom: userData.prenom,
        email: userData.email,
        mot_de_passe: userData.motDePasse // Utiliser mot_de_passe
      }),

  /*
  // Ajouter une méthode pour créer un admin
createAdminUser: async () => {
  try {
    const response = await api.post('/auth/register', {
      nom: 'Admin',
      prenom: 'Super',
      email: 'admin@votre-domaine.com',
      mot_de_passe: 'admin123'
    });
    console.log('✅ Utilisateur admin créé:', response.data);
    return response;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Erreur création admin:', error.response?.data || error.message);
    }
    throw error;
  }
},
   */
  
  logout: () => api.post('/auth/logout'),
  
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