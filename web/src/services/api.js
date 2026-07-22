import axios from 'axios';

/**
 * Résout l'URL de base de l'API.
 * Priorité :
 *   1. Configuration injectée par l'app desktop Electron (window.desktopConfig.serverUrl)
 *   2. Variable de build VITE_API_URL
 *   3. Chemin relatif '/api/v1' (déploiement web derrière Nginx)
 */
export function getApiBaseUrl() {
  if (typeof window !== 'undefined' && window.desktopConfig?.serverUrl) {
    return window.desktopConfig.serverUrl;
  }
  return import.meta.env.VITE_API_URL || '/api/v1';
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Ajout automatique du token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Gestion centralisée des erreurs 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.hash.startsWith('#/login') && !window.location.pathname.startsWith('/login')) {
        window.location.href = window.desktopConfig ? '#/login' : '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
