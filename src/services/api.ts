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
    // Nouvelle méthode pour récupérer les paiements du caissier connecté
    getMesPaiements: async (page = 1, limit = 10) => {
        const response = await api.get(`/paiements/mes-paiements?page=${page}&limit=${limit}`);
        return response.data;
    },

    logout: () => api.post('/auth/logout'),

  getCurrentUser: () => api.get('/user'),


  // Client endpoints
  getProfile: () => api.get('/profile'),

    getPaiements: async (page = 1, limit = 10) => {
        const response = await api.get('/paiements', { params: { page, limit } });
        // ✅ CORRECT : retourner directement response.data
        return response.data;
    },

  createPaiement: async (paiementData: {
    type: 'credit' | 'debit' | 'payment';  // ✅ Types valides selon backend
    montant: number;
    nom_client: string;      // ✅ Requis par le backend
    prenom_client: string;   // ✅ Requis par le backend
    mode_paiement: 'espece' | 'cheque' | 'tpe' | 'virement';  // ✅ Requis
    numero_police?: string;
    numero_piece?: string;
    montant_lettres?: string;
    description?: string;
  })  => {
      try {
          const response = await api.post('/paiements', {
              ...paiementData,
              nom: paiementData.nom_client, // Mapper nom_client vers nom
              prenom: paiementData.prenom_client, // Mapper prenom_client vers prenom
          });
          return response;
      } catch (error: unknown) {
          if (axios.isAxiosError(error)) {
              throw new Error(error.response?.data?.message || 'Erreur lors de la création du paiement');
          }
          throw error;
      }
  },

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

    // Dans api.ts, ajouter ces méthodes
    getPaiementsByDate: async (date: string) => {
      try {
        const response = await api.get(`/admin/daily-report?date=${date}`);
        return response;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des paiements');
        }
        throw error;
      }
    },

    deleteClient: async (clientId: number, data: { justification: string }) => {
      try {
        const response = await api.delete(`/clients/${clientId}`, { data });
        return response;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          throw new Error(error.response?.data?.message || 'Erreur lors de la suppression du client');
        }
        throw error;
      }
    },
};

export default api;