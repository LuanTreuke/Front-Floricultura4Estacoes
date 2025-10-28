"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '../../services/authService';
import { fetchOrders, updateOrderStatus } from '../../services/orderService';
import { fetchProductById } from '../../services/productService';
import styles from '../../styles/AdminPedidos.module.css';

export default function MeusPedidosPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Tenta extrair um 'cart' do campo observacao (retorna array ou null)
  function extractCart(obs: any) {
    if (!obs) return null;
    try {
      const parsed = typeof obs === 'string' ? JSON.parse(obs) : obs;
      if (parsed && Array.isArray(parsed.cart)) return parsed.cart;
      if (Array.isArray(parsed)) return parsed;
      return null;
    } catch (e) {
      return null;
    }
  }

  // retorna um objeto Date para ordenação, preferindo data_pedido+hora_pedido,
  // caindo para data_entrega/hora_entrega e, se ausente, retorna epoch 0
  function parseOrderDateTime(o: any) {
    const date = o.data_pedido || o.data_entrega || null;
    const time = o.hora_pedido || o.hora_entrega || '00:00:00';
    if (!date) return new Date(0);
    // normaliza hora caso seja 'HH:mm'
    let t = time;
    if (t && t.length === 5) t = t + ':00';
    // cria ISO-like string para Date parsing
    try {
      return new Date(`${date}T${t}`);
    } catch (e) {
      return new Date(0);
    }
  }

  useEffect(() => {
    (async () => {
      const usuario: any = getCurrentUser();
      if (!usuario || !usuario.id) {
        // redireciona para login se não estiver autenticado
        router.push('/login');
        return;
      }

      try {
        const all: any[] = await fetchOrders();
        // filtra apenas pedidos do usuário
        const mine = (all || []).filter(p => (p.Usuario_id && p.Usuario_id === usuario.id) || (p.usuario && p.usuario.id === usuario.id));

        // enriquecer com imagens/nomes preferindo dados embutidos em observacao
        const enriched = await Promise.all(mine.map(async (p: any) => {
          const cart = extractCart(p.carrinho || p.observacao) || [];
          const imgsFromItems = (cart || []).map((it: any) => it && it.imagem_url).filter(Boolean);
          const namesFromItems = (cart || []).map((it: any) => it && it.nome).filter(Boolean);
          const ids = (cart || []).map((it: any) => it && it.id).filter(Boolean);

          if (imgsFromItems.length > 0) return { ...p, _images: imgsFromItems, _imageIndex: 0, _productNames: namesFromItems, _cart: cart };
          if (ids.length === 0) return { ...p, _images: [], _imageIndex: 0, _productNames: [], _cart: cart };
          try {
            const proms = ids.map((id: number) => fetchProductById(id));
            const prods = await Promise.all(proms);
            const imgs = prods.map(pr => pr && pr.imagem_url ? pr.imagem_url : '').filter(Boolean);
            const names = prods.map(pr => pr && pr.nome ? pr.nome : '').filter(Boolean);
            return { ...p, _images: imgs, _imageIndex: 0, _productNames: names, _cart: cart };
          } catch (e) {
            return { ...p, _images: [], _imageIndex: 0, _productNames: [], _cart: cart };
          }
        }));

        // ordenar do mais recente para o mais antigo
        enriched.sort((a: any, b: any) => {
          const ta = parseOrderDateTime(a).getTime();
          const tb = parseOrderDateTime(b).getTime();
          return tb - ta;
        });
        setOrders(enriched);
      } catch (err) {
        console.error('Falha ao carregar pedidos', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function handleCancel(id: number) {
    if (!confirm('Deseja cancelar este pedido?')) return;
    try {
      // atualiza status para 'Cancelado' (backend aceita string)
      await updateOrderStatus(id, 'Cancelado');
      setOrders(curr => curr.map(o => o.id === id ? { ...o, status: 'Cancelado' } : o));
    } catch (e) {
      console.error(e);
      alert('Erro ao cancelar pedido');
    }
  }

  function prevImage(orderId: number) {
    setOrders(curr => curr.map(o => {
      if (o.id !== orderId) return o;
      const len = (o._images || []).length || 0;
      if (len <= 1) return o;
      const idx = typeof o._imageIndex === 'number' ? o._imageIndex : 0;
      return { ...o, _imageIndex: (idx - 1 + len) % len };
    }));
  }

  function nextImage(orderId: number) {
    setOrders(curr => curr.map(o => {
      if (o.id !== orderId) return o;
      const len = (o._images || []).length || 0;
      if (len <= 1) return o;
      const idx = typeof o._imageIndex === 'number' ? o._imageIndex : 0;
      return { ...o, _imageIndex: (idx + 1) % len };
    }));
  }

  if (loading) return <div className={styles.container}>Carregando seus pedidos...</div>;

  return (
    <div className={styles.container}>
      <h1>Meus Pedidos</h1>
      {orders.length === 0 ? (
        <div>Você não possui pedidos.</div>
      ) : (
        <div className={styles.grid}>
          {orders.map(o => (
            <div key={o.id} className={styles.card}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 160, textAlign: 'center' }}>
                  {(o._images && o._images.length > 0) ? (
                    <div style={{ position: 'relative' }}>
                      <img src={o._images[o._imageIndex || 0]} style={{ width: 160, height: 160, objectFit: 'cover', borderRadius: 8 }} />
                      {o._images.length > 1 && (
                        <>
                          <button onClick={() => prevImage(o.id)} style={{ position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 8px', cursor: 'pointer' }}>{'<'}</button>
                          <button onClick={() => nextImage(o.id)} style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 8px', cursor: 'pointer' }}>{'>'}</button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div style={{ width: 160, height: 160, background: '#f3f3f3', borderRadius: 8 }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div><strong>Pedido #{o.id}</strong></div>
                      <div>
                        <strong>Data:</strong>{' '}
                        {o.data_pedido || o.data_entrega || '—'}
                        { (o.hora_pedido || o.hora_entrega) ? (
                          <span>{' '}—{' '}{o.hora_pedido || o.hora_entrega}</span>
                        ) : null }
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div><strong>Status:</strong> {o.status}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <strong>Produtos:</strong>
                    <ul style={{ margin: '8px 0 0 16px' }}>
                      {((o._cart && o._cart.length) ? o._cart : (extractCart(o.carrinho || o.observacao) || [])).map((it: any, idx: number) => (
                        <li key={idx}>{it.nome || (o._productNames && o._productNames[idx]) || `#${it.id || idx}`} {it.quantidade ? `x ${it.quantidade}` : ''} {it.preco ? `— R$ ${Number(it.preco).toFixed(2)}` : ''}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    {o.status === 'Recebido' ? (
                      <button className={styles.secondaryBtn} onClick={() => handleCancel(o.id)}>Cancelar pedido</button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
