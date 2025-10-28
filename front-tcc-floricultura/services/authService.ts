import api from './api';

export async function login(email: string, senha: string) {
  const res = await api.post(`/usuario/login`, { email, senha });
  return res.data;
}

export async function cadastro(data: { nome: string; email: string; senha: string; telefone?: string }) {
  const res = await api.post(`/usuario/cadastro`, data);
  return res.data;
}

export type User = { id?: number; nome?: string; role?: string; cargo?: string; telefone?: string; email?: string } | null;

export function getCurrentUser(): User {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('usuario');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // O backend pode retornar sob `usuario` ou `user`.
    // Também tolera objetos duplamente embalados como { usuario: { ... } }.
    if (parsed == null) return null;
    if (typeof parsed === 'object') {
      if (parsed.usuario && typeof parsed.usuario === 'object') return parsed.usuario as User;
      if (parsed.user && typeof parsed.user === 'object') return parsed.user as User;
      if (parsed.id) return parsed as User;
    }
    return parsed as User;
  } catch (err) {
    console.warn('getCurrentUser: failed to parse localStorage usuario', err);
    return null;
  }
}

export function logout() {
  if (typeof window === 'undefined') return;
  try {
    // remove user info
    const raw = localStorage.getItem('usuario');
  let userId: number | null = null;
    try {
      if (raw) {
        const parsed = JSON.parse(raw);
        const u = parsed && (parsed.usuario || parsed.user) ? (parsed.usuario || parsed.user) : parsed;
        if (u && (u.id || u.id === 0)) userId = u.id;
      }
    } catch (e) {}
    // Ensure that after logout the visible cart is not contaminated by
    // the previous authenticated user's local cache. Remove the guest
    // key so a not-logged-in visitor starts with an empty cart. We do
    // NOT copy the user's cart into the guest session.
    try {
      try { localStorage.removeItem('floricultura_cart_v1'); } catch (e) {}
    } catch (e) {}
    localStorage.removeItem('usuario');
    try {
      // notify other listeners (same tab) that cart changed/cleared
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new Event('cart-updated'));
      }
    } catch (e) {}
  } catch (err) {
    console.warn('logout: failed to remove usuario from localStorage', err);
  }
}
