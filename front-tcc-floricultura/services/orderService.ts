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
      } catch (whErr: unknown) {
        // don't block the user if whatsapp fails; just log for debugging
        try {
          // try to extract axios-like response info if present
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const candidate = (whErr as any)?.response?.data ?? (whErr as any)?.message ?? undefined;
          console.warn('Failed to send whatsapp confirmation', candidate ?? String(whErr));
        } catch (logErr) {
          console.warn('Failed to send whatsapp confirmation', String(whErr));
        }
      }
    }
    return created;
  } catch (err: unknown) {
    // Avoid using `any` in lint-restricted environments; return a readable message
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(msg);
  }
}

export async function fetchOrders() {
  // If current user is Admin, fetch all orders; otherwise fetch only the user's orders
  try {
    const user = getCurrentUser();
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
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(msg);
  }
}

export async function fetchOrderById(id: number) {
  try {
    const res = await api.get(`/pedidos/${id}`);
    return res.data;
  } catch (err) {
    console.warn('fetchOrderById failed', err instanceof Error ? err.message : String(err));
    return null;
  }
}

export async function updateOrderStatus(id: number, status: string) {
  try {
    const res = await api.patch(`/pedidos/${id}/status`, { status });
    return res.data;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(msg);
  }
}
