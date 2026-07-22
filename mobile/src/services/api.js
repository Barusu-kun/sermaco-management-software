import axios from 'axios';

const STORAGE_KEY = 'apiBaseUrl';

/**
 * URL de base de l'API.
 * Priorité :
 *   1. URL configurée par l'utilisateur (écran de connexion) — indispensable
 *      pour l'app native (Android/iOS) qui vise un serveur distant.
 *   2. Variable de build VITE_API_URL.
 *   3. Chemin relatif '/api/v1' (PWA derrière Nginx).
 */
export function getApiBaseUrl() {
  const stored = typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY);
  if (stored) return stored;
  return import.meta.env.VITE_API_URL || '/api/v1';
}

export function setApiBaseUrl(url) {
  const clean = String(url || '').trim().replace(/\/+$/, '');
  if (clean) localStorage.setItem(STORAGE_KEY, clean);
  else localStorage.removeItem(STORAGE_KEY);
  api.defaults.baseURL = getApiBaseUrl();
}

// Détecte si l'app tourne en natif (Capacitor) : dans ce cas une URL serveur est requise.
export function isNativePlatform() {
  return typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('driver');
      if (!window.location.hash.startsWith('#/login') && !window.location.pathname.startsWith('/login')) {
        window.location.href = '#/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
