import api from './api';
import { getCurrentUser } from './authService';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface CreateOrderDto {
  imagem_entrega?: string;
  hora_entrega?: string;
  data_entrega?: string;
  nome_destinatario?: string;
  data_pedido?: string;
  hora_pedido?: string;
  nome_cliente?: string;
  telefone_cliente?: string;
  status?: string;
  pagamento_confirmado?: boolean;
  cobrar_no_endereco?: boolean;
  observacao?: string;
  carrinho?: string;
  Endereco_id: number;
  Usuario_id: number;
}

export async function createOrder(dto: CreateOrderDto) {
  try {
    const res = await api.post('/pedidos', dto);
    const created = res.data;
    // if phone provided, request backend to send whatsapp confirmation
    if (dto.telefone_cliente) {
      try {
        await api.post('/whatsapp/send-confirm', { phone: dto.telefone_cliente });
      } catch (whErr: any) {
        // don't block the user if whatsapp fails; just log for debugging
        console.warn('Failed to send whatsapp confirmation', (whErr?.response?.data) ?? whErr?.message ?? String(whErr));
      }
    }
    return created;
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
    throw new Error(msg);
  }
}

export async function fetchOrders() {
  // If current user is Admin, fetch all orders; otherwise fetch only the user's orders
  try {
    const user: any = getCurrentUser();
    if (user && (user.role === 'Admin' || user.cargo === 'Admin')) {
      const res = await api.get('/pedidos');
      return res.data;
    }
    if (user && (user.id || user.id === 0)) {
      const res = await api.get(`/pedidos/usuario/${user.id}`);
      return res.data;
    }
    // not logged in: return empty
    return [];
  } catch (err: any) {
    // rethrow with useful message
    const resp = err && err.response ? err.response : null;
    const status = resp && resp.status ? resp.status : null;
    const data = resp && resp.data ? resp.data : null;
    let msg = (err && err.message) || String(err);
    if (status) msg = `[${status}] ${JSON.stringify(data || msg)}`;
    throw new Error(msg);
  }
}

export async function fetchOrderById(id: number) {
  try {
    const res = await api.get(`/pedidos/${id}`);
    return res.data;
  } catch (err: any) {
    console.warn('fetchOrderById failed', err?.response?.status || err.message || err);
    return null;
  }
}

export async function updateOrderStatus(id: number, status: string) {
  try {
    const res = await api.patch(`/pedidos/${id}/status`, { status });
    return res.data;
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
    throw new Error(msg);
  }
}
