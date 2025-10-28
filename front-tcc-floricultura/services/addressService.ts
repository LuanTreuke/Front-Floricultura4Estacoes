import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface AddressDto {
  id?: number;
  rua: string;
  numero: string;
  bairro: string;
  cep: string;
  cidade: string;
  complemento?: string;
  Usuario_id?: number | null;
}

export async function fetchAddresses() {
  try {
    const res = await axios.get(`${API_URL}/enderecos`);
    return res.data as AddressDto[];
  } catch (err: any) {
    if (err.response) {
      console.warn('fetchAddresses: backend responded with status', err.response.status, err.response.data);
    } else {
      console.warn('fetchAddresses: request failed', err.message || err);
    }
    return [];
  }
}

export async function createAddress(dto: AddressDto) {
  try {
  // mostrar payload enviado para depuração
  // eslint-disable-next-line no-console
  console.debug('[createAddress] sending dto:', dto);
    const res = await axios.post(`${API_URL}/enderecos`, dto);
    return res.data as AddressDto;
  } catch (err: any) {
  // Monta uma mensagem legível a partir do erro do axios (status + corpo quando presente)
    const resp = err && err.response ? err.response : null;
    const respData = resp && resp.data ? resp.data : null;
    let msg: string;
    if (respData) {
      try {
        msg = typeof respData === 'string' ? respData : JSON.stringify(respData);
      } catch (e) {
        msg = String(respData);
      }
    } else {
      msg = (err && err.message) || String(err);
    }
    if (resp && resp.status) msg = `[${resp.status}] ${msg}`;
    console.error('createAddress failed', msg);
  // Lança Error com a mensagem para que o componente possa exibir
  throw new Error(msg);
  }
}

export async function updateAddress(id: number, dto: Partial<AddressDto>) {
  try {
    const res = await axios.patch(`${API_URL}/enderecos/${id}`, dto);
    return res.data as AddressDto;
  } catch (err: any) {
    console.error('updateAddress failed', err?.response?.data || err.message || err);
    throw err;
  }
}

export async function deleteAddress(id: number) {
  try {
    await axios.delete(`${API_URL}/enderecos/${id}`);
    return true;
  } catch (err: any) {
    console.error('deleteAddress failed', err?.response?.data || err.message || err);
    throw err;
  }
}
