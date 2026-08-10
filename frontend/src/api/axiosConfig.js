import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

api.interceptors.request.use((config) => {
  const session = JSON.parse(localStorage.getItem('authSession') || 'null');
  if (session?.token && session.expiresAt > Date.now()) config.headers.Authorization = `Bearer ${session.token}`;
  return config;
});

export default api;
