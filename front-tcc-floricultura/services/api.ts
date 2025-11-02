import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

const api = axios.create({
  baseURL: API_URL,
  // withCredentials: true, // enable if you use cookie-based auth
  timeout: 10000,
});

// ngrok: evita página de aviso (ERR_NGROK_6024) garantindo resposta JSON
try {
  if (API_URL && /ngrok-free\.app/i.test(API_URL)) {
    // header especial que instrui o ngrok a pular a página de aviso
    api.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';
    // garante preferencia por JSON
    api.defaults.headers.common['Accept'] = 'application/json';
  }
} catch {}

if (!API_URL) {
  try {
    // Surface a helpful warning only in the browser console
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.warn('[api] NEXT_PUBLIC_API_URL não definido. Configure a variável de ambiente no projeto Vercel.');
    }
  } catch {}
}
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
  } catch {
    // ignore failures reading localStorage
    // but keep a lightweight guard for debugging if needed
    // console.warn('api interceptor read user failed', e);
  }
  return config;
});

export default api;
