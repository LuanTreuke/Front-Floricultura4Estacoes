"use client";
import React, { useEffect, useState } from 'react';
import { fetchOrders, updateOrderStatus } from '../../../services/orderService';
import styles from '../../../styles/AdminPedidos.module.css';

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders().then((o: any[]) => { setOrders(o || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  async function handleChangeStatus(id: number, status: string) {
    try {
      await updateOrderStatus(id, status);
      setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
    } catch (err) { console.error(err); alert('Erro ao atualizar status'); }
  }

  if (loading) return <div>Carregando pedidos...</div>;

  return (
    <div className={styles.container}>
      <h1>Gerenciar Pedidos</h1>
      <div className={styles.grid}>
        {orders.map(o => (
          <div key={o.id} className={styles.card}>
            <div className={styles.row}>
              <div className={styles.meta}>
                <div><strong>Cliente:</strong> {o.nome_cliente || o.usuario?.nome}</div>
                <div><strong>Telefone:</strong> {o.telefone_cliente}</div>
                <div><strong>Endereço:</strong> {o.endereco ? `${o.endereco.rua}, ${o.endereco.numero}` : '—'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div><strong>Status:</strong> {o.status}</div>
                <div className={styles.statusActions}>
                  <button className={styles.btn} onClick={() => handleChangeStatus(o.id, 'Recebido')}>Recebido</button>
                  <button className={styles.btn} onClick={() => handleChangeStatus(o.id, 'Entregue')}>Entregue</button>
                </div>
              </div>
            </div>
            {o.observacao && <div style={{ marginTop: 8 }}><strong>Obs:</strong> {o.observacao}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
