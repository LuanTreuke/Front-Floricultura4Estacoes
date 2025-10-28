"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from '../../../styles/OrderDetails.module.css';
import { fetchOrderById } from '../../../services/orderService';

function formatDateTime(dateStr?: string, timeStr?: string) {
  if (!dateStr) return '—';
  const datePart = dateStr;
  const timePart = timeStr ? (timeStr.length === 5 ? timeStr + ':00' : timeStr) : '00:00:00';
  const d = new Date(`${datePart}T${timePart}`);
  if (isNaN(d.getTime())) return `${datePart} ${timeStr || ''}`;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

export default function PedidoDetalhePage() {
  const params = useParams();
  const id = Number(params?.id);
  const router = useRouter();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const o = await fetchOrderById(id);
      setOrder(o);
      setLoading(false);
    })();
  }, [id]);

  function extractCart(obs: any) {
    if (!obs) return [];
    try {
      const parsed = typeof obs === 'string' ? JSON.parse(obs) : obs;
      // formatos possíveis: { cart: [...] } | [...] | { items: [...] }
      if (parsed && Array.isArray(parsed.cart)) return parsed.cart;
      if (parsed && Array.isArray(parsed.items)) return parsed.items;
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch (e) { return []; }
  }

  if (loading) return <div className={styles.container}>Carregando...</div>;
  if (!order) return <div className={styles.container}>Pedido não encontrado</div>;

  const cart = extractCart(order.carrinho) || [];
  const unique = [] as any[];
  const seen = new Set<string>();
  cart.forEach((it: any) => {
    const key = `${it.id || ''}::${it.nome || ''}`;
    if (!seen.has(key)) { seen.add(key); unique.push(it); }
    else {
      const ex = unique.find(u => (u.id === it.id && u.nome === it.nome));
      if (ex) ex.quantidade = (ex.quantidade || 0) + (it.quantidade || 0);
    }
  });

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Pedido #{order.id}</h1>
      <div className={styles.card}>
        <div className={styles.row}>
          <div className={styles.left}>
            <div className={styles.meta}>
              <div className={styles.metaItem}><span className={styles.label}>Cliente:</span> <span className={styles.muted}>{order.nome_cliente || order.usuario?.nome}</span></div>
              <div className={styles.metaItem}><span className={styles.label}>Telefone:</span> <span className={styles.muted}>{order.telefone_cliente || order.usuario?.telefone || '—'}</span></div>
              <div className={styles.metaItem}><span className={styles.label}>Endereço:</span> <span className={styles.muted}>{order.endereco ? `${order.endereco.rua}, ${order.endereco.numero}${order.endereco.complemento ? ' • ' + order.endereco.complemento : ''} — ${order.endereco.bairro}${order.endereco.cidade ? ', ' + order.endereco.cidade : ''}${order.endereco.cep ? ' • CEP: ' + order.endereco.cep : ''}` : (order.Endereco_id ? `ID ${order.Endereco_id}` : '—')}</span></div>
              <div className={styles.metaItem}><span className={styles.label}>Data & Hora entrega:</span> <span className={styles.muted}>{formatDateTime(order.data_entrega, order.hora_entrega)}</span></div>
            </div>
          </div>
          <div className={styles.rightColumn}>
            <div className={styles.status}><span className={styles.label}>Status:</span> {order.status}</div>
            <div><span className={styles.label}>Pedido em:</span> <span className={styles.muted}>{formatDateTime(order.data_pedido, order.hora_pedido)}</span></div>
            <div><span className={styles.label}>Cobrar no endereço:</span> <span className={styles.muted}>{((order.cobrar_no_endereco === 1) || (order.cobrar_no_endereco === '1') || (order.cobrar_no_endereco === true)) ? 'Sim' : 'Não'}</span></div>
          </div>
        </div>

        <div className={styles.productList}>
          <strong>Produtos:</strong>
          <ul>
            {unique.map((it: any, idx: number) => (
              <li key={idx} className={styles.productItem}>
                { (it.imagem_url || it.imagem || it.imagemUrl) ? (
                  <img className={styles.productImg} src={it.imagem_url || it.imagem || it.imagemUrl} alt={it.nome} />
                ) : (
                  <div className={styles.productImg}>Img</div>
                )}
                <div className={styles.productInfo}>
                  <div className={styles.productTitle}>{it.nome}</div>
                  <div className={styles.productDesc}>{it.descricao || it.categoria ? `${it.descricao || ''}` : ''}</div>
                </div>
                <div className={styles.productQuantityPrice}>
                  <div>{it.quantidade ? `x ${it.quantidade}` : ''}</div>
                  <div style={{ fontWeight: 600 }}>{it.preco ? `R$ ${Number(it.preco).toFixed(2)}` : ''}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ marginTop: 12 }}>
          <strong>Observação:</strong>
          <div style={{ marginTop: 8 }}>
            {order.observacao ? (() => {
              try {
                const parsed = typeof order.observacao === 'string' ? JSON.parse(order.observacao) : order.observacao;
                return <pre className={styles.obsPre}>{JSON.stringify(parsed, null, 2)}</pre>;
              } catch (e) {
                return <div style={{ whiteSpace: 'pre-wrap' }}>{String(order.observacao)}</div>;
              }
            })() : <div>—</div>}
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.secondaryBtn} onClick={() => router.back()}>Voltar</button>
        </div>
      </div>
    </div>
  );
}
