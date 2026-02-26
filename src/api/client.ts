import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.DEV
  ? '/api'
  : (import.meta.env.VITE_API_URL || 'https://secure-notes-api-u4ve.onrender.com');

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let hasShown401Toast = false;

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API Error]', error?.response?.status, error?.config?.method?.toUpperCase(), error?.config?.url, error?.response?.data || error?.message);
    if (error.response?.status === 401 && !hasShown401Toast) {
      hasShown401Toast = true;
      toast.error('Session expired. Please sign in again.', { duration: 5000 });
      useAuthStore.getState().logout();

      setTimeout(() => { hasShown401Toast = false; }, 5000);
    }
    return Promise.reject(error);
  }
);
