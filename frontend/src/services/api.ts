import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add auth header to all requests
api.interceptors.request.use((config) => {
  const walletAddress = localStorage.getItem('walletAddress');
  if (walletAddress) {
    config.headers['x-wallet-address'] = walletAddress;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Clear auth and redirect to login
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('userRole');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Sales API
export const salesApi = {
  submitSales: (formData: FormData) => api.post('/submit-sales', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getSubmissions: () => api.get('/submissions'),
};

// Audit API
export const auditApi = {
  verifyFile: (formData: FormData) => api.post('/verify', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAuditHistory: () => api.get('/audit-history'),
};

// Admin API
export const adminApi = {
  addUser: (userAddress: string, role: string) => 
    api.post('/admin/add-user', { userAddress, role }),
  removeUser: (userAddress: string) => 
    api.delete('/admin/remove-user', { data: { userAddress } }),
  getUsers: () => api.get('/admin/users'),
  getLogs: () => api.get('/admin/logs'),
  getStats: () => api.get('/admin/stats'),
};