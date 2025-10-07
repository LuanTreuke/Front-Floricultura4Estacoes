export interface CartItem {
  id: number;
  nome: string;
  preco: number;
  quantidade: number;
  imagem_url?: string;
}

const STORAGE_KEY = 'floricultura_cart_v1';

export function getCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartItem[];
  } catch (e) {
    console.error('getCart parse error', e);
    return [];
  }
}

export function saveCart(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function addToCart(item: Omit<CartItem, 'quantidade'>, qtd = 1) {
  const cart = getCart();
  const found = cart.find(i => i.id === item.id);
  if (found) {
    found.quantidade += qtd;
  } else {
    cart.push({ ...item, quantidade: qtd });
  }
  saveCart(cart);
  return cart;
}

export function updateQty(productId: number, quantidade: number) {
  const cart = getCart();
  const idx = cart.findIndex(i => i.id === productId);
  if (idx === -1) return cart;
  if (quantidade <= 0) cart.splice(idx, 1);
  else cart[idx].quantidade = quantidade;
  saveCart(cart);
  return cart;
}

export function removeFromCart(productId: number) {
  const cart = getCart().filter(i => i.id !== productId);
  saveCart(cart);
  return cart;
}

export function clearCart() {
  saveCart([]);
}

export function cartTotal() {
  const cart = getCart();
  return cart.reduce((s, i) => s + (i.preco || 0) * (i.quantidade || 1), 0);
}

export default { getCart, saveCart, addToCart, updateQty, removeFromCart, clearCart, cartTotal };
