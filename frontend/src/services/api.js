import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
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

// Auth API
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (email, password) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    return api.post('/api/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },
  googleLogin: (idToken) => api.post('/api/auth/google', { id_token: idToken }),
  getMe: () => api.get('/api/auth/me'),
};

// Movies API
export const moviesAPI = {
  getAll: (params) => api.get('/api/movies', { params }),
  getById: (id) => api.get(`/api/movies/${id}`),
  create: (data) => api.post('/api/movies', data),
  update: (id, data) => api.put(`/api/movies/${id}`, data),
  delete: (id) => api.delete(`/api/movies/${id}`),
  stream: (id) => api.get(`/api/movies/${id}/stream`),
  getPurchases: () => api.get('/api/movies/user/purchases'),
  likeMovie: (movieId, reaction) => api.post('/api/movies/like', { movie_id: movieId, reaction }),
  subscribeMovie: (movieId) => api.post(`/api/movies/subscribe?movie_id=${movieId}`),
  getSubscriptions: () => api.get('/api/movies/subscriptions'),
};

// Payments API
export const paymentsAPI = {
  initiate: (data) => api.post('/api/payments/initiate', data),
  checkStatus: (checkoutRequestId) => api.get(`/api/payments/status/${checkoutRequestId}`),
};

// Admin API
export const adminAPI = {
  getStats: () => api.get('/api/admin/stats'),
  getUsers: (params) => api.get('/api/admin/users', { params }),
  getPayments: (params) => api.get('/api/admin/payments', { params }),
  getPurchases: (params) => api.get('/api/admin/purchases', { params }),
};

export default api;
