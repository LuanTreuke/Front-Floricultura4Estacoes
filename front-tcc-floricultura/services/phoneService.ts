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
    const usuario = getCurrentUser();
    if (!usuario || !usuario.id) return [];
    const res = await api.get(`/telefones/usuario/${usuario.id}`);
    return res.data as PhoneDto[];
  } catch (err) {
    if (err instanceof Error) {
      console.warn('fetchPhones: request failed', err.message);
    } else {
      console.warn('fetchPhones: request failed', String(err));
    }
    return [];
  }
}

export async function createPhone(dto: PhoneDto) {
  try {
    console.debug('[createPhone] sending dto:', dto);
    const res = await api.post(`/telefones`, dto);
    return res.data as PhoneDto;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('createPhone failed', msg);
    throw new Error(msg);
  }
}

export async function updatePhone(id: number, dto: Partial<PhoneDto>) {
  try {
    const res = await api.patch(`/telefones/${id}`, dto);
    return res.data as PhoneDto;
  } catch (err) {
    console.error('updatePhone failed', err instanceof Error ? err.message : String(err));
    throw err;
  }
}

export async function deletePhone(id: number) {
  try {
    await api.delete(`/telefones/${id}`);
    return true;
  } catch (err) {
    console.error('deletePhone failed', err instanceof Error ? err.message : String(err));
    throw err;
  }
}
