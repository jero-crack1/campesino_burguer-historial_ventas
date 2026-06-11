import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const message = err.response?.data?.error || err.response?.data?.message || 'Error de conexión';
    return Promise.reject(new Error(message));
  }
);

export default api;
