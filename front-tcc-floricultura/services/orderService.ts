import axios from 'axios';

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
  Endereco_id: number;
  Usuario_id: number;
}

export async function createOrder(dto: CreateOrderDto) {
  try {
    const res = await axios.post(`${API_URL}/pedidos`, dto);
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

export async function fetchOrders() {
  const res = await axios.get(`${API_URL}/pedidos`);
  return res.data;
}

export async function updateOrderStatus(id: number, status: string) {
  try {
    const res = await axios.patch(`${API_URL}/pedidos/${id}/status`, { status });
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
