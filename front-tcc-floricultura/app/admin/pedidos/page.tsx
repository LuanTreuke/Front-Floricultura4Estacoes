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
    nome_destinatario?: string | null;
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
  const [notifyDisabled, setNotifyDisabled] = useState<Record<number, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string | null>(() => {
    // inicializa com a data local (YYYY-MM-DD)
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }); // YYYY-MM-DD
  const [sortBy, setSortBy] = useState<'hora_pedido' | 'hora_entrega' | null>('hora_pedido');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [statusSelections, setStatusSelections] = useState<Record<string, string>>({});

  function displayStatus(status?: string | null) {
    if (!status) return '—';
    if (status === 'Em_Rota') return 'Saiu para entrega';
    // replace underscore with space for other statuses
    return String(status).replace(/_/g, ' ');
  }

  function formatTime(t?: string | null) {
    if (!t) return '—';
    if (typeof t !== 'string') return String(t);
    // common formats: HH:MM, HH:MM:SS, or ISO-like strings containing time
    if (t.length === 5) return t; // HH:MM
    if (t.length === 8) return t.slice(0, 5); // HH:MM:SS -> HH:MM
    const m = t.match(/(\d{2}:\d{2})/);
    return m ? m[1] : t;
  }

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

  // derive per-order notification preference from backend field when orders change
  useEffect(() => {
    try {
      const map: Record<number, boolean> = {};
      (orders || []).forEach(o => {
        const id = typeof o.id === 'number' ? o.id as number : undefined;
        if (!id) return;
        // notifications_enabled can be numeric (0/1) or boolean; consider missing value as enabled
        const raw = (o as any).notifications_enabled;
        // treat 0 or '0' or false as disabled
        const isDisabled = raw === 0 || raw === '0' || raw === false ? true : false;
        map[id] = isDisabled;
      });
      setNotifyDisabled(map);
    } catch (e) {
      // ignore
    }
  }, [orders]);

  async function toggleNotify(orderId?: number) {
    if (!orderId) return;
    // optimistic update: flip local state first so the UI responds immediately
    const prev = notifyDisabled[orderId] === true;
    setNotifyDisabled(curr => ({ ...curr, [orderId]: !prev }));

    try {
  const currentlyDisabled = prev;
  // prev == notifyDisabled (true when notifications are currently disabled)
  // We want to set the backend `notifications_enabled` to the new value.
  // currentNotificationsEnabled = !currentlyDisabled
  // newNotificationsEnabled = !currentNotificationsEnabled = currentlyDisabled
  const enabled = currentlyDisabled; // flip: if currently disabled -> enable (true); if currently enabled -> disable (false)
      // call backend to persist
      console.log('[admin/pedidos] toggleNotify sending', { orderId, enabled });
      const mod = await (await import('../../../services/orderService')).setOrderNotifications(orderId, enabled);
      // backend returns updated order; update orders list
      if (mod) {
        setOrders(curr => curr.map(o => o.id === orderId ? { ...o, ...(mod || {}) } : o));
      }
      // ensure local map reflects backend value (notifications_enabled may be 0/1)
      const newRaw = (mod as any)?.notifications_enabled;
      const newDisabled = newRaw === 0 || newRaw === '0' || newRaw === false ? true : false;
      setNotifyDisabled(curr => ({ ...curr, [orderId]: newDisabled }));
    } catch (e) {
      console.error('Failed to toggle notifications', e);
      // revert optimistic change
      setNotifyDisabled(curr => ({ ...curr, [orderId]: prev }));
      alert('Erro ao atualizar preferências de notificação');
    }
  }

  async function handleChangeStatus(id: number, status: string) {
    try {
      await updateOrderStatus(id, status);
      setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
    } catch (err) { console.error(err); alert('Erro ao atualizar status'); }
  }

  // image carousel controls removed from admin view (keeps UI simpler). If needed later, re-add handlers.

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

  if (loading) return <div className={styles.container}>Carregando pedidos...</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Gerenciar Pedidos</h1>
      <div className={styles.header}>
        <div className={styles.toolbar}>
          <div className={styles.filters}>
            <label style={{ fontWeight: 600, marginRight: 8 }}>Status</label>
            {/* mobile-only label (CSS will show this only on small screens) */}
            <span className={styles.mobileStatusLabel}>Status</span>
            {/* Mostrar todos os possíveis status, mesmo que não existam pedidos com eles ainda */}
            <select
              value={statusFilter ?? ''}
              onChange={e => setStatusFilter(e.target.value || null)}
              style={{ padding: '8px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', minWidth: 180 }}
            >
              <option value="">Todos</option>
              {['Recebido', 'Preparando', 'Em_Rota', 'Entregue', 'Cancelado'].map(s => (
                <option key={s} value={s}>{displayStatus(s)}</option>
              ))}
            </select>
          </div>

          <div className={styles.filters}>
            <label style={{ fontWeight: 600, marginRight: 8 }}>Ordenar</label>
            {/* mobile-only label for sort controls */}
            <span className={styles.mobileSortLabel}>Ordenar</span>
            <button className={styles.btn} onClick={() => { setSortBy('hora_pedido'); setSortDir(sortBy === 'hora_pedido' && sortDir === 'desc' ? 'asc' : 'desc'); }}>Hora Pedido {sortBy === 'hora_pedido' ? (sortDir === 'desc' ? '↓' : '↑') : ''}</button>
            <button className={styles.btn} onClick={() => { setSortBy('hora_entrega'); setSortDir(sortBy === 'hora_entrega' && sortDir === 'desc' ? 'asc' : 'desc'); }}>Hora Entrega {sortBy === 'hora_entrega' ? (sortDir === 'desc' ? '↓' : '↑') : ''}</button>
          </div>

          <div className={styles.filters}>
            <label style={{ fontWeight: 600, marginRight: 8 }}>Data</label>
            {/* mobile-only label (CSS will show this only on small screens) */}
            <span className={styles.mobileDateLabel}>Data</span>
            <input type="date" value={dateFilter || ''} onChange={e => setDateFilter(e.target.value || null)} />
            {dateFilter && <button className={`${styles.secondaryBtn} ${styles.clearBtn}`} onClick={() => setDateFilter(null)}>Limpar</button>}
            <button className={`${styles.secondaryBtn} ${styles.clearBtn}`} onClick={() => { setStatusFilter(null); setDateFilter(null); setSortBy(null); setSortDir('desc'); }}>Limpar</button>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        {visibleOrders.map(o => (
          <div key={o.id} className={styles.card}>
            <button className={styles.bellBtn} onClick={() => toggleNotify(typeof o.id === 'number' ? o.id as number : undefined)} aria-label="Toggle notifications for this order">
              {notifyDisabled && typeof o.id === 'number' && notifyDisabled[o.id] ? (
                <i className="bi bi-bell-slash" aria-hidden></i>
              ) : (
                <i className="bi bi-bell" aria-hidden></i>
              )}
            </button>
            <div className={styles.thumb}>
              {(o._images && o._images.length > 0) ? (
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  {o._images && o._images[o._imageIndex || 0] ? (
                    <Image src={String(o._images[o._imageIndex || 0])} alt={String(o.nome_cliente ?? o.id ?? '')} width={140} height={140} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#f3f3f3' }} />
                  )}
                </div>
              ) : (
                <div style={{ width: '100%', height: '100%', background: '#f3f3f3' }} />
              )}
            </div>

            <div className={styles.details}>
                <div className={styles.meta}>
                  <div><strong>Cliente:</strong> {o.nome_cliente || o.usuario?.nome}</div>
                  <div><strong>Para:</strong> {o.nome_destinatario || '—'}</div>
                <div><strong>Telefone:</strong> {o.telefone_cliente || '—'}</div>
                <div>
                  <strong>Endereço:</strong>{' '}
                  {o.endereco ? (
                    `${o.endereco.rua}, ${o.endereco.numero}${o.endereco.complemento ? ' • ' + o.endereco.complemento : ''} — ${o.endereco.bairro}${o.endereco.cidade ? ', ' + o.endereco.cidade : ''}${o.endereco.cep ? ' • CEP: ' + o.endereco.cep : ''}`
                  ) : (
                    o.Endereco_id ? `ID ${o.Endereco_id}` : '—'
                  )}
                </div>
                {/* horários: hora de entrega e hora do pedido (empilhados abaixo do endereço) */}
                <div className={styles.times}>
                  <div>
                    <strong>Hora de entrega:</strong> {formatTime(o['hora_entrega'] as string | null)}
                    {(() => {
                      const d = (o['data_entrega'] as string | null);
                      const fm = (function(d?: string | null) {
                        if (!d) return null;
                        const s = String(d);
                        if (s.includes('T')) {
                          try { const dt = new Date(s); if (!isNaN(dt.getTime())) return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}`; } catch {}
                        }
                        const m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
                        if (m) return `${m[3]}/${m[2]}`;
                        return null;
                      })(d);
                      return fm ? ` • ${fm}` : '';
                    })()}
                  </div>
                  <div>
                    <strong>Hora do pedido:</strong> {formatTime(o['hora_pedido'] as string | null)}
                    {(() => {
                      const d = (o['data_pedido'] as string | null);
                      const fm = (function(d?: string | null) {
                        if (!d) return null;
                        const s = String(d);
                        if (s.includes('T')) {
                          try { const dt = new Date(s); if (!isNaN(dt.getTime())) return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}`; } catch {}
                        }
                        const m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
                        if (m) return `${m[3]}/${m[2]}`;
                        return null;
                      })(d);
                      return fm ? ` • ${fm}` : '';
                    })()}
                  </div>
                </div>
              </div>

              {/* produtos */}
              {(() => {
                const cart = extractCart(o.carrinho || o.observacao) || [];
                if (cart && cart.length) {
                  return (
                    <div className={styles.productList}>
                      {cart.map((it: AnyObj, idx: number) => (
                        <span key={idx} className={styles.badge}>
                          {((it['nome'] as string) || (o._productNames && o._productNames[idx]) || `Produto #${(it['id'] as number | undefined) ?? idx}`)} {it['quantidade'] !== undefined ? ` x ${(it['quantidade'] as number)}` : ''}
                        </span>
                      ))}
                    </div>
                  );
                }
                if (o._productNames && o._productNames.length) {
                  return (
                    <div className={styles.productList}>
                      {o._productNames.map((n: string, i: number) => <span key={i} className={styles.badge}>{n}</span>)}
                    </div>
                  );
                }
                return null;
              })()}

              <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 8 }}>
                <button className={styles.secondaryBtn} onClick={() => { window.location.href = `/pedido/${o.id}`; }}>Ver detalhes</button>
              </div>
            </div>

      <div className={styles.statusColumn}>
    <div className={`${styles.statusLabel} ${styles.rightMeta}`}><strong>Status:</strong> {displayStatus(o.status as string | null)}</div>
          <div className={styles.statusActions}>
                  {/* Select box with allowed statuses (exclude 'Recebido') */}
                  <select
                    value={statusSelections[String(o.id ?? '')] || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (typeof o.id === 'number') setStatusSelections(curr => ({ ...curr, [String(o.id)]: val }));
                    }}
                    style={{ padding: '8px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', minWidth: 140 }}
                  >
                    <option value="">Alterar status</option>
                    {['Preparando', 'Em_Rota', 'Entregue', 'Cancelado'].map(s => (
                      <option key={s} value={s}>{s === 'Em_Rota' ? 'Saiu para entrega' : s.replace('_', ' ')}</option>
                    ))}
                  </select>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className={styles.btn}
                      onClick={() => {
                        const sel = statusSelections[String(o.id ?? '')] || '';
                        if (typeof o.id === 'number' && sel) {
                          handleChangeStatus(o.id, sel);
                          setStatusSelections(curr => ({ ...curr, [String(o.id)]: '' }));
                        }
                      }}
                      disabled={!statusSelections[String(o.id ?? '')]}
                    >
                      Atualizar
                    </button>
                  </div>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
