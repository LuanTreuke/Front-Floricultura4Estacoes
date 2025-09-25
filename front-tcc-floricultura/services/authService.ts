import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function login(email: string, senha: string) {
  const res = await axios.post(`${API_URL}/usuario/login`, { email, senha });
  return res.data;
}

export async function cadastro(data: { nome: string; email: string; senha: string; telefone?: string }) {
  const res = await axios.post(`${API_URL}/usuario/cadastro`, data);
  return res.data;
}

export function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('usuario');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
  // O backend pode retornar sob `usuario` ou `user`.
  // Também tolera objetos duplamente embalados como { usuario: { ... } }.
    if (parsed == null) return null;
    if (typeof parsed === 'object') {
      if (parsed.usuario && typeof parsed.usuario === 'object') return parsed.usuario;
      if (parsed.user && typeof parsed.user === 'object') return parsed.user;
      if (parsed.id) return parsed;
    }
    return parsed;
  } catch (err) {
    console.warn('getCurrentUser: failed to parse localStorage usuario', err);
    return null;
  }
}

export function logout() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('usuario');
  } catch (err) {
    console.warn('logout: failed to remove usuario from localStorage', err);
  }
}
