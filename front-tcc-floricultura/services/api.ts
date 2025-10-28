import axios from 'axios';
import type { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.0.122:3001';

const api = axios.create({
  baseURL: API_URL,
  // withCredentials: true, // enable if you use cookie-based auth
  timeout: 10000,
});
// attach current user id to requests when available so backend can perform simple role checks
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('usuario');
      if (raw) {
        const parsed = JSON.parse(raw);
        const u = parsed && (parsed.usuario || parsed.user) ? (parsed.usuario || parsed.user) : parsed;
        if (u && (u.id || u.id === 0)) {
          // merge headers while preserving types; cast via unknown to satisfy axios internal header type
          const prev = config.headers as Record<string, unknown> | undefined;
          const newHeaders = ({ ...(prev || {}), ['x-user-id']: String(u.id) } as unknown) as InternalAxiosRequestConfig['headers'];
          config.headers = newHeaders;
        }
      }
    }
  } catch (e: unknown) {
    // ignore failures reading localStorage
    // but keep a lightweight guard for debugging if needed
    // console.warn('api interceptor read user failed', e);
  }
  return config;
});

export default api;
