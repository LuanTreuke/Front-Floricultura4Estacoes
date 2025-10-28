import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.0.122:3001';

const api = axios.create({
  baseURL: API_URL,
  // withCredentials: true, // enable if you use cookie-based auth
  timeout: 10000,
});
// attach current user id to requests when available so backend can perform simple role checks
api.interceptors.request.use((config) => {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('usuario');
      if (raw) {
        const parsed = JSON.parse(raw);
        const u = parsed && (parsed.usuario || parsed.user) ? (parsed.usuario || parsed.user) : parsed;
        if (u && (u.id || u.id === 0)) {
          // assign a new headers object to avoid typing issues
          config.headers = {
            ...(config.headers || {}),
            ['x-user-id']: String(u.id),
          } as typeof config.headers;
        }
      }
    }
  } catch (e) {}
  return config;
});

export default api;
