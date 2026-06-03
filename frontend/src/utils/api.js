import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api',
  timeout: 60000, // 60s for AI calls
  headers: { 'Content-Type': 'application/json' },
});

// ---- Request: attach JWT ----
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ---- Response: handle errors globally ----
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status  = error.response?.status;
    const message = error.response?.data?.error || error.message;

    if (status === 401) {
      localStorage.removeItem('sp_token');
      localStorage.removeItem('sp_user');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (status === 429) {
      const data = error.response.data;
      if (data?.upgrade) {
        toast.error('AI credits exhausted. Upgrade to Pro for unlimited access.');
      } else {
        toast.error('Too many requests. Please slow down.');
      }
      return Promise.reject(error);
    }

    if (status >= 500) {
      toast.error('Server error. Please try again.');
    }

    return Promise.reject(error);
  }
);

export default api;
