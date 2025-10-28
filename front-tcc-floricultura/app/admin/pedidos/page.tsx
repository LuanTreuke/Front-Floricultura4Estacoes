"use client";
import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { fetchOrders, updateOrderStatus } from '../../../services/orderService';
import { fetchProductById } from '../../../services/productService';
import { fetchAddresses } from '../../../services/addressService';
import styles from '../../../styles/AdminPedidos.module.css';

export default function AdminPedidosPage() {
  type AnyObj = Record<string, unknown>;
  type Order = AnyObj & {
    id?: number;
    _images?: string[];
    _imageIndex?: number;
    _productNames?: string[];
    nome_cliente?: string;
    usuario?: { nome?: string } | null;
    telefone_cliente?: string | null;
    endereco?: { rua?: string; numero?: string; complemento?: string; bairro?: string; cidade?: string; cep?: string } | null;
    Endereco_id?: number | null;
    status?: string;
    data_pedido?: string;
    data_entrega?: string;
  };
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string | null>(null); // YYYY-MM-DD
  const [sortBy, setSortBy] = useState<'hora_pedido' | 'hora_entrega' | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Extrai lista de produtos do campo observacao, segura contra JSON inválido
  const extractCart = useCallback((obs: unknown): AnyObj[] | null => {
    if (!obs) return null;
    try {
      const parsed = typeof obs === 'string' ? JSON.parse(obs) as unknown : obs;
      // formato esperado: { cart: [ { id, nome, preco, quantidade }, ... ] }
      if (parsed && typeof parsed === 'object') {
        const obj = parsed as Record<string, unknown>;
        if (Array.isArray(obj['cart'])) return obj['cart'] as AnyObj[];
      }
      // às vezes observacao pode ser apenas um array
      if (Array.isArray(parsed)) return parsed as AnyObj[];
      return null;
    } catch {
      // não quebrar a página se observacao não for JSON
      return null;
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const o = (await fetchOrders()) as AnyObj[];
    let arr: Order[] = (o || []) as Order[];
        // se algum pedido não veio com a relação endereco, tente buscar endereços e casar por Endereco_id
        const needsAddresses = arr.some(x => !x.endereco && x.Endereco_id);
        if (needsAddresses) {
          const addrs = await fetchAddresses() as unknown as AnyObj[];
          const map = new Map<number, AnyObj>();
          addrs.forEach((a: AnyObj) => { if ((a.id as number | undefined)) map.set(a.id as number, a); });
          arr = arr.map((p: AnyObj) => ({ ...p, endereco: (p['endereco'] as AnyObj) || (p['Endereco_id'] ? map.get(p['Endereco_id'] as number) : null) }));
        }
        // Enriquecer pedidos com imagens dos produtos (quando presentes em observacao)
  const enriched = await Promise.all(arr.map(async (p: AnyObj) => {
          // aceitar o novo campo `carrinho` (string JSON) ou cair para `observacao` para compatibilidade
    const cart = extractCart(p['carrinho'] ?? p['observacao']) || [];
          // primeiro, tente extrair imagens e nomes diretamente do item (quando o pedido foi feito direto no produto)
    const imgsFromItems = (cart || []).map((it: AnyObj) => (it && (it['imagem_url'] as string)) ).filter((v) => Boolean(v)) as string[];
    const namesFromItems = (cart || []).map((it: AnyObj) => (it && (it['nome'] as string)) ).filter((v) => Boolean(v)) as string[];
    const ids = (cart || []).map((it: AnyObj) => (it && (it['id'] as number)) ).filter((id) => Boolean(id)) as number[];

          // se encontramos imagens já presentes na observacao, use-as
          if (imgsFromItems.length > 0) return { ...p, _images: imgsFromItems, _imageIndex: 0, _productNames: namesFromItems };

          // caso contrário, tente buscar pelos ids
          if (ids.length === 0) return { ...p, _images: [], _imageIndex: 0, _productNames: [] };
          try {
            const proms = ids.map((id: number) => fetchProductById(id));
            const prods = await Promise.all(proms);
            const imgs = prods.map(pr => pr?.imagem_url ?? '').filter((v) => Boolean(v)) as string[];
            const names = prods.map(pr => pr?.nome ?? '').filter((v) => Boolean(v)) as string[];
            return { ...p, _images: imgs, _imageIndex: 0, _productNames: names };
          } catch {
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
  }, [extractCart]);

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

  // aplica filtros e ordenação sem modificar o estado original
  const visibleOrders = React.useMemo(() => {
    let arr = (orders || []).slice();
    if (statusFilter) arr = arr.filter(o => (o.status || '').toLowerCase() === statusFilter.toLowerCase());
    if (dateFilter) {
      arr = arr.filter(o => (o.data_pedido === dateFilter) || (o.data_entrega === dateFilter));
    }
    if (sortBy) {
      arr.sort((a: AnyObj, b: AnyObj) => {
        const aval = a[sortBy] as unknown as string | undefined;
        const bval = b[sortBy] as unknown as string | undefined;
        const ta = aval ? (aval.length === 5 ? aval + ':00' : aval) : '00:00:00';
        const tb = bval ? (bval.length === 5 ? bval + ':00' : bval) : '00:00:00';
        const da = ((a['data_pedido'] as string) || (a['data_entrega'] as string) ) || '';
        const db = ((b['data_pedido'] as string) || (b['data_entrega'] as string) ) || '';
        const dta = new Date(da + 'T' + ta).getTime() || 0;
        const dtb = new Date(db + 'T' + tb).getTime() || 0;
        return sortDir === 'asc' ? dta - dtb : dtb - dta;
      });
    }
    return arr;
  }, [orders, statusFilter, dateFilter, sortBy, sortDir]);

  if (loading) return <div>Carregando pedidos...</div>;

  return (
    <div className={styles.container}>
      <h1>Gerenciar Pedidos</h1>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <strong>Filtrar por status:</strong>
          {[...new Set(orders.map(o => o.status))].map((s) => (
            <button key={String(s)} className={styles.btn} onClick={() => setStatusFilter(statusFilter === s ? null : (s ?? null))} style={{ background: statusFilter === s ? '#ddd' : undefined }}>{s}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <strong>Ordenar por:</strong>
          <button className={styles.btn} onClick={() => { setSortBy('hora_pedido'); setSortDir(sortBy === 'hora_pedido' && sortDir === 'desc' ? 'asc' : 'desc'); }}>Hora Pedido {sortBy === 'hora_pedido' ? (sortDir === 'desc' ? '↓' : '↑') : ''}</button>
          <button className={styles.btn} onClick={() => { setSortBy('hora_entrega'); setSortDir(sortBy === 'hora_entrega' && sortDir === 'desc' ? 'asc' : 'desc'); }}>Hora Entrega {sortBy === 'hora_entrega' ? (sortDir === 'desc' ? '↓' : '↑') : ''}</button>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <strong>Filtrar por dia:</strong>
          <input type="date" value={dateFilter || ''} onChange={e => setDateFilter(e.target.value || null)} />
          {dateFilter && <button className={styles.secondaryBtn} onClick={() => setDateFilter(null)}>Limpar</button>}
          <button className={styles.secondaryBtn} onClick={() => { setStatusFilter(null); setDateFilter(null); setSortBy(null); setSortDir('desc'); }}>Limpar filtros</button>
        </div>
      </div>

      <div className={styles.grid}>
        {visibleOrders.map(o => (
          <div key={o.id} className={styles.card}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 160, textAlign: 'center' }}>
                {(o._images && o._images.length > 0) ? (
                  <div style={{ position: 'relative' }}>
                    {o._images && o._images[o._imageIndex || 0] ? (
                      <Image src={String(o._images[o._imageIndex || 0])} alt={String(o.nome_cliente ?? o.id ?? '')} width={160} height={160} style={{ objectFit: 'cover', borderRadius: 8 }} />
                    ) : (
                      <div style={{ width: 160, height: 160, background: '#f3f3f3', borderRadius: 8 }} />
                    )}
                    {o._images.length > 1 && (
                      <>
                        <button onClick={() => (typeof o.id === 'number' ? prevImage(o.id) : undefined)} style={{ position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 8px', cursor: 'pointer' }}>{'<'}</button>
                        <button onClick={() => (typeof o.id === 'number' ? nextImage(o.id) : undefined)} style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 8px', cursor: 'pointer' }}>{'>'}</button>
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
                    {/* produto principal removido daqui para evitar duplicação; produtos listados abaixo */}
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
                      <button className={styles.btn} onClick={() => (typeof o.id === 'number' ? handleChangeStatus(o.id, 'Recebido') : undefined)}>Recebido</button>
                      <button className={styles.btn} onClick={() => (typeof o.id === 'number' ? handleChangeStatus(o.id, 'Entregue') : undefined)}>Entregue</button>
                    </div>
                  </div>
                </div>
                {/* Exibe produtos extraídos de observacao (quando presentes) */}
                {(() => {
                  const cart = extractCart(o.carrinho || o.observacao) || [];
                  if (cart && cart.length) {
                    // se o observacao continha nomes/imagens nos items, use-os
                    return (
                      <div style={{ marginTop: 8 }}>
                        <strong>Produtos:</strong>
                        <ul style={{ margin: '8px 0 0 16px' }}>
                          {cart.map((it: AnyObj, idx: number) => (
                            <li key={idx}>
                              {((it['nome'] as string) || (o._productNames && o._productNames[idx]) || `Produto #${(it['id'] as number | undefined) ?? idx}`)} {(it['quantidade'] !== undefined ? `x ${(it['quantidade'] as number)}` : '')} {(it['preco'] !== undefined ? `— R$ ${Number(it['preco']).toFixed(2)}` : '')}
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button className={styles.secondaryBtn} onClick={() => { window.location.href = `/pedido/${o.id}`; }}>Ver detalhes</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
