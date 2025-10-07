"use client";
import React, { useEffect, useState } from 'react';
import { fetchOrders, updateOrderStatus } from '../../../services/orderService';
import { fetchProductById } from '../../../services/productService';
import styles from '../../../styles/AdminPedidos.module.css';

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Extrai lista de produtos do campo observacao, segura contra JSON inválido
  function extractCart(obs: any) {
    if (!obs) return null;
    try {
      const parsed = typeof obs === 'string' ? JSON.parse(obs) : obs;
      // formato esperado: { cart: [ { id, nome, preco, quantidade }, ... ] }
      if (parsed && Array.isArray(parsed.cart)) return parsed.cart;
      // às vezes observacao pode ser apenas um array
      if (Array.isArray(parsed)) return parsed;
      return null;
    } catch (e) {
      // não quebrar a página se observacao não for JSON
      return null;
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const o: any[] = await fetchOrders();
        let arr = o || [];
        // se algum pedido não veio com a relação endereco, tente buscar endereços e casar por Endereco_id
        const needsAddresses = arr.some(x => !x.endereco && x.Endereco_id);
        if (needsAddresses) {
          const { fetchAddresses } = require('../../../services/addressService');
          const addrs = await fetchAddresses();
          const map = new Map<number, any>();
          addrs.forEach((a: any) => { if (a.id) map.set(a.id, a); });
          arr = arr.map((p: any) => ({ ...p, endereco: p.endereco || (p.Endereco_id ? map.get(p.Endereco_id) : null) }));
        }
        // Enriquecer pedidos com imagens dos produtos (quando presentes em observacao)
        const enriched = await Promise.all(arr.map(async (p: any) => {
          const cart = extractCart(p.observacao) || [];
          // primeiro, tente extrair imagens e nomes diretamente do item (quando o pedido foi feito direto no produto)
          const imgsFromItems = (cart || []).map((it: any) => it && it.imagem_url).filter(Boolean);
          const namesFromItems = (cart || []).map((it: any) => it && it.nome).filter(Boolean);
          const ids = (cart || []).map((it: any) => it && it.id).filter((id: any) => !!id);

          // se encontramos imagens já presentes na observacao, use-as
          if (imgsFromItems.length > 0) return { ...p, _images: imgsFromItems, _imageIndex: 0, _productNames: namesFromItems };

          // caso contrário, tente buscar pelos ids
          if (ids.length === 0) return { ...p, _images: [], _imageIndex: 0, _productNames: [] };
          try {
            const proms = ids.map((id: number) => fetchProductById(id));
            const prods = await Promise.all(proms);
            const imgs = prods.map(pr => pr && pr.imagem_url ? pr.imagem_url : '').filter(Boolean);
            const names = prods.map(pr => pr && pr.nome ? pr.nome : '').filter(Boolean);
            return { ...p, _images: imgs, _imageIndex: 0, _productNames: names };
          } catch (e) {
            return { ...p, _images: [], _imageIndex: 0, _productNames: [] };
          }
        }));
        setOrders(enriched);
      } catch (e) {
        console.error('Failed to load orders', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleChangeStatus(id: number, status: string) {
    try {
      await updateOrderStatus(id, status);
      setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
    } catch (err) { console.error(err); alert('Erro ao atualizar status'); }
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

  if (loading) return <div>Carregando pedidos...</div>;

  return (
    <div className={styles.container}>
      <h1>Gerenciar Pedidos</h1>
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
                <div className={styles.row}>
                  <div className={styles.meta}>
                    <div><strong>Cliente:</strong> {o.nome_cliente || o.usuario?.nome}</div>
                    <div><strong>Telefone:</strong> {o.telefone_cliente}</div>
                    {/* Mostrar produto principal (quando disponível) */}
                    {(() => {
                      const cart = extractCart(o.observacao) || [];
                      const firstFromCart = (cart && cart.length && (cart[0].nome || cart[0].id)) ? (cart[0].nome || `#${cart[0].id}`) : null;
                      const firstFromEnriched = (o._productNames && o._productNames.length) ? o._productNames[0] : null;
                      const prodName = firstFromCart || firstFromEnriched;
                      if (prodName) return <div><strong>Produto:</strong> {prodName}</div>;
                      return null;
                    })()}
                    <div>
                      <strong>Endereço:</strong>{' '}
                      {o.endereco ? (
                        `${o.endereco.rua}, ${o.endereco.numero}${o.endereco.complemento ? ' • ' + o.endereco.complemento : ''} — ${o.endereco.bairro}${o.endereco.cidade ? ', ' + o.endereco.cidade : ''}${o.endereco.cep ? ' • CEP: ' + o.endereco.cep : ''}`
                      ) : (
                        o.Endereco_id ? `ID ${o.Endereco_id}` : '—'
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div><strong>Status:</strong> {o.status}</div>
                    <div className={styles.statusActions}>
                      <button className={styles.btn} onClick={() => handleChangeStatus(o.id, 'Recebido')}>Recebido</button>
                      <button className={styles.btn} onClick={() => handleChangeStatus(o.id, 'Entregue')}>Entregue</button>
                    </div>
                  </div>
                </div>
                {/* Exibe produtos extraídos de observacao (quando presentes) */}
                {(() => {
                  const cart = extractCart(o.observacao) || [];
                  if (cart && cart.length) {
                    // se o observacao continha nomes/imagens nos items, use-os
                    return (
                      <div style={{ marginTop: 8 }}>
                        <strong>Produtos:</strong>
                        <ul style={{ margin: '8px 0 0 16px' }}>
                          {cart.map((it: any, idx: number) => (
                            <li key={idx}>
                              {it.nome || (o._productNames && o._productNames[idx]) || `Produto #${it.id || idx}`} {it.quantidade ? `x ${it.quantidade}` : ''} {it.preco ? `— R$ ${Number(it.preco).toFixed(2)}` : ''}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  }
                  // fallback: se não houver cart, mas _productNames existe (por enriquecimento), exiba-os
                  if (o._productNames && o._productNames.length) {
                    return (
                      <div style={{ marginTop: 8 }}>
                        <strong>Produtos:</strong>
                        <ul style={{ margin: '8px 0 0 16px' }}>
                          {o._productNames.map((n: string, i: number) => <li key={i}>{n}</li>)}
                        </ul>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
