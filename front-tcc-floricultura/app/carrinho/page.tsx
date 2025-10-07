"use client";
import React, { useEffect, useState } from 'react';
import styles from '../../styles/ProductPage.module.css';
import cartStyles from '../../styles/ShoppingCart.module.css';
import { getCart, CartItem, updateQty, removeFromCart, clearCart, cartTotal } from '../../services/cartService';
import { createOrder } from '../../services/orderService';
import { fetchAddresses, AddressDto } from '../../services/addressService';
import { getCurrentUser } from '../../services/authService';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const usuario: any = getCurrentUser();
    if (!usuario || !usuario.id) return;
    (async () => {
      const all = await fetchAddresses();
      const my = (all || []).filter((a: any) => a.Usuario_id === usuario.id);
      setAddresses(my);
      if (my.length > 0) setSelectedAddress(my[0].id || null);
    })();
  }, []);

  useEffect(() => {
    const c = getCart();
    setItems(c);
    setTotal(cartTotal());
  }, []);

  function handleQtyChange(id: number, q: number) {
    const updated = updateQty(id, q);
    setItems(updated);
    setTotal(cartTotal());
  }

  function handleRemove(id: number) {
    const updated = removeFromCart(id);
    setItems(updated);
    setTotal(cartTotal());
  }

  async function handleCheckout() {
    if (items.length === 0) return alert('Carrinho vazio');

    const usuario: any = getCurrentUser();
    if (!usuario || !usuario.id) {
      if (confirm('Você precisa estar logado para finalizar o pedido. Ir para login?')) {
        router.push('/login');
      }
      return;
    }

    if (!selectedAddress) {
      if (confirm('Nenhum endereço cadastrado. Deseja adicionar um agora?')) {
        router.push('/cadastro/endereco');
      }
      return;
    }

    try {
      localStorage.setItem('checkout_selected_address', String(selectedAddress));
    } catch (err) {
      console.warn('failed to save checkout_selected_address', err);
    }
    router.push('/pedido');
  }

  return (
    <div className={cartStyles.container}>
      <h2 className={cartStyles.heading}>Carrinho</h2>
      {items.length === 0 ? (
        <div className={cartStyles.empty}>Seu carrinho está vazio</div>
      ) : (
        <div>
          <div className={cartStyles.list}>
            {items.map(it => (
              <div key={it.id} className={cartStyles.item}>
                <img src={it.imagem_url || '/bouquet1.jpg'} className={cartStyles.itemImage} />
                <div className={cartStyles.itemInfo}>
                  <div className={cartStyles.itemName}>{it.nome}</div>
                  <div className={cartStyles.itemPrice}>R$ {Number(it.preco).toFixed(2)}</div>
                </div>
                <div className={cartStyles.qtyWrap}>
                  <input className={cartStyles.qtyInput} type="number" value={it.quantidade} min={1} onChange={e => handleQtyChange(it.id, Number(e.target.value))} />
                </div>
                <div>
                  <button className={cartStyles.removeBtn} onClick={() => handleRemove(it.id)}>Remover</button>
                </div>
              </div>
            ))}
          </div>
          <div className={cartStyles.summary}>
            <div className={cartStyles.total}>Total: R$ {Number(total).toFixed(2)}</div>
            <div>
              <button className={cartStyles.checkoutBtn} onClick={handleCheckout} disabled={loading}>Finalizar pedido</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
