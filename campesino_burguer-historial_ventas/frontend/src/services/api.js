import axios from 'axios';

const TOKEN_KEY = 'cb_token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('cb_user');
      window.location.href = '/login';
    }
    const message = err.response?.data?.error || err.response?.data?.message || 'Error de conexión';
    return Promise.reject(new Error(message));
  }
);

export default api;
