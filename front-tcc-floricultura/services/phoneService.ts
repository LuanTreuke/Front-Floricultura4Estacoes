import api from './api';
import { getCurrentUser } from './authService';

export interface PhoneDto {
  id?: number;
  telefone: string;
  Usuario_id?: number | null;
}

export async function fetchPhones() {
  try {
    // Prefer asking the server for phones belonging to the current user.
    // If no user is logged in, return an empty list (no phones available).
    const usuario: any = getCurrentUser();
    if (!usuario || !usuario.id) return [];
    const res = await api.get(`/telefones/usuario/${usuario.id}`);
    return res.data as PhoneDto[];
  } catch (err: any) {
    if (err.response) {
      console.warn('fetchPhones: backend responded with status', err.response.status, err.response.data);
    } else {
      console.warn('fetchPhones: request failed', err.message || err);
    }
    return [];
  }
}

export async function createPhone(dto: PhoneDto) {
  try {
    console.debug('[createPhone] sending dto:', dto);
    const res = await api.post(`/telefones`, dto);
    return res.data as PhoneDto;
  } catch (err: any) {
    const resp = err && err.response ? err.response : null;
    const respData = resp && resp.data ? resp.data : null;
    let msg: string;
    if (respData) {
      try { msg = typeof respData === 'string' ? respData : JSON.stringify(respData); } catch (e) { msg = String(respData); }
    } else {
      msg = (err && err.message) || String(err);
    }
    if (resp && resp.status) msg = `[${resp.status}] ${msg}`;
    console.error('createPhone failed', msg);
    throw new Error(msg);
  }
}

export async function updatePhone(id: number, dto: Partial<PhoneDto>) {
  try {
    const res = await api.patch(`/telefones/${id}`, dto);
    return res.data as PhoneDto;
  } catch (err: any) {
    console.error('updatePhone failed', err?.response?.data || err.message || err);
    throw err;
  }
}

export async function deletePhone(id: number) {
  try {
    await api.delete(`/telefones/${id}`);
    return true;
  } catch (err: any) {
    console.error('deletePhone failed', err?.response?.data || err.message || err);
    throw err;
  }
}
