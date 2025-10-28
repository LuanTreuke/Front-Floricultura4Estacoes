import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function addProduct(produto: Omit<Product, 'id'>): Promise<Product> {
  const res = await axios.post(`${API_URL}/produtos`, produto);
  return res.data as Product;
}

export async function fetchProductById(id: number): Promise<Product | null> {
  try {
    const res = await axios.get(`${API_URL}/produtos/${id}`);
    return res.data as Product;
  } catch (err: unknown) {
    const maybeErr = err as { response?: { status?: number } } | undefined;
    const resp = maybeErr?.response;
    if (resp) {
      console.warn('fetchProductById: backend returned', resp.status);
      return null;
    }
    console.warn('fetchProductById: request failed', (err as Error)?.message ?? String(err));
    return null;
  }
}
export interface Product {
  id: number;
  nome: string;
  descricao?: string;
  preco: number;
  imagem_url?: string;
  Categoria_id?: number;
  categoria?: { id: number; nome?: string } | null;
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await axios.get(`${API_URL}/produtos`);
    return res.data as Product[];
  } catch (err: unknown) {
    const maybeErr = err as { response?: { status?: number } } | undefined;
    const status = maybeErr?.response?.status;
    console.warn('fetchProducts failed', status ?? (err as Error)?.message ?? String(err));
    return [];
  }
}

export async function deleteProduct(id: number): Promise<boolean> {
  try {
    const res = await axios.delete(`${API_URL}/produtos/${id}`);
    return res.status === 200 || res.status === 204 || (res.data && res.data.deleted === true);
  } catch (err: unknown) {
    const maybeErr = err as { response?: { status?: number } } | undefined;
    const status = maybeErr?.response?.status;
    console.warn('deleteProduct failed', status ?? (err as Error)?.message ?? String(err));
    return false;
  }
}

export async function updateProduct(id: number, payload: Partial<Product>): Promise<Product | null> {
  try {
    const res = await axios.patch(`${API_URL}/produtos/${id}`, payload);
    return res.data as Product;
  } catch (err: unknown) {
    const maybeErr = err as { response?: { status?: number } } | undefined;
    const status = maybeErr?.response?.status;
    console.warn('updateProduct failed', status ?? (err as Error)?.message ?? String(err));
    return null;
  }
}
