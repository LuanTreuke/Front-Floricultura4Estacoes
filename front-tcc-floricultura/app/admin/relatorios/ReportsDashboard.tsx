"use client";
import React, { useEffect, useRef, useState } from 'react';
import styles from '../../../styles/AdminRelatorios.module.css';
import { fetchOrders } from '../../../services/orderService';
import api from '../../../services/api';

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

function loadCss(href: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`link[href="${href}"]`)) return resolve();
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    l.onload = () => resolve();
    l.onerror = () => reject(new Error(`Failed to load ${href}`));
    document.head.appendChild(l);
  });
}

export default function ReportsDashboard() {
  const chartOrdersRef = useRef<HTMLCanvasElement | null>(null);
  const chartUsersRef = useRef<HTMLCanvasElement | null>(null);
  const [orders, setOrders] = useState<Record<string, any>[]>([]);
  const [ordersCount, setOrdersCount] = useState<number | null>(null);
  const [usersCount, setUsersCount] = useState<number | null>(null);
  const [cancelledCount, setCancelledCount] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // load AdminLTE CSS to get the admin theme look
    const adminCss = 'https://cdn.jsdelivr.net/npm/admin-lte@3.2.0/dist/css/adminlte.min.css';
    loadCss(adminCss).catch((e) => console.warn('AdminLTE CSS failed to load', e));

    // load Chart.js from CDN and create some demo charts
    const CDN = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    let charts: any[] = [];
    // initial data load
    (async () => {
      try {
        setLoading(true);
        const o = await fetchOrders();
        setOrders(Array.isArray(o) ? o as Record<string, any>[] : []);
        // compute totals
        const total = Array.isArray(o) ? o.length : 0;
        const cancelled = Array.isArray(o) ? (o as Record<string, any>[]).filter((x) => {
          const s = String((x.status ?? '')).toLowerCase();
          return s === 'cancelado' || s.includes('cancel');
        }).length : 0;
        setOrdersCount(total);
        setCancelledCount(cancelled);
        // fetch users
        try {
          const res = await api.get('/usuarios');
          const users = Array.isArray(res.data) ? res.data : [];
          setUsersCount(users.length);
        } catch (e) {
          console.warn('Failed to fetch users', e);
          setUsersCount(null);
        }
      } catch (err) {
        console.error('Failed to load reports data', err);
        setError(String(err));
      } finally {
        setLoading(false);
      }
    })();

    loadScript(CDN).then(() => {
      // @ts-ignore
      const Chart = (window as any).Chart;
      if (!Chart) return;

      // charts will be rendered once data is available; we still create empty placeholders here
      if (chartOrdersRef.current) {
        const ctx = chartOrdersRef.current.getContext('2d');
        const c = new Chart(ctx, { type: 'line', data: { labels: [], datasets: [{ label: 'Pedidos', data: [], borderColor: '#28a745', backgroundColor: 'rgba(40,167,69,0.08)' }] }, options: { responsive: true } });
        charts.push(c);
      }
      if (chartUsersRef.current) {
        const ctx = chartUsersRef.current.getContext('2d');
        const c = new Chart(ctx, { type: 'bar', data: { labels: [], datasets: [{ label: 'Novos usuários', data: [], backgroundColor: '#17a2b8' }] }, options: { responsive: true } });
        charts.push(c);
      }
    }).catch((e) => console.error('Chart.js load failed', e));

    return () => { charts.forEach(c => c?.destroy && c.destroy()); };
  }, []);

  // update charts when orders/users change
  useEffect(() => {
    const CDN = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    let chartInstances: any[] = [];
    (async () => {
      try {
        await loadScript(CDN);
        // @ts-ignore
        const Chart = (window as any).Chart;
        if (!Chart) return;

        // orders per month (aggregate by YYYY-MM), applying date range filter if present
        if (chartOrdersRef.current) {
          const ctx = chartOrdersRef.current.getContext('2d');
          const byMonth: Record<string, number> = {};

          // helper: try several fields to find a date string
          const extractDateStr = (o: any) => {
            const candidates = [o.data_pedido, o.data_entrega, o.createdAt, o.created_at, o.data, o.pedido_data, o.date];
            for (const c of candidates) {
              if (!c) continue;
              const s = String(c);
              // try ISO or YYYY-MM-DD substrings
              const m = s.match(/(\d{4}-\d{2}-\d{2})/);
              if (m) return m[1];
              // fallback: if looks like YYYYMMDD
              const m2 = s.match(/(\d{4})(\d{2})(\d{2})/);
              if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}`;
            }
            return null;
          };

          // apply start/end date filter when present
          const sDate = startDate ? new Date(startDate) : null;
          const eDate = endDate ? new Date(endDate) : null;

          // diagnostic log: show a few sample order date-like values
          try {
            // eslint-disable-next-line no-console
            console.debug('ReportsDashboard: orders count', Array.isArray(orders) ? orders.length : 0);
            // show first 6 raw date candidates for debugging
            // eslint-disable-next-line no-console
            console.debug('Sample dates', (orders || []).slice(0,6).map((o: any) => ({ id: o.id, data_pedido: o.data_pedido, data_entrega: o.data_entrega })));
          } catch (e) {
            // ignore logging errors
          }

          (orders || []).forEach((o) => {
            let dstr = extractDateStr(o);
            // fallback: try direct substring if robust extractor failed
            if (!dstr) {
              const raw = o.data_pedido ?? o.data_entrega ?? '';
              const s = String(raw || '').trim();
              if (s.length >= 10) dstr = s.slice(0,10);
            }
            if (!dstr) return;
            const d = new Date(dstr);
            if (isNaN(d.getTime())) return;
            if (sDate && d < sDate) return;
            if (eDate && d > eDate) return;
            const monthKey = dstr.slice(0,7); // YYYY-MM
            byMonth[monthKey] = (byMonth[monthKey] || 0) + 1;
          });

          const monthKeys = Object.keys(byMonth).sort();
          const labels = monthKeys.map(k => {
            const [y, m] = k.split('-');
            const dt = new Date(Number(y), Number(m) - 1, 1);
            return dt.toLocaleString(undefined, { month: 'short', year: 'numeric' });
          });
          const data = monthKeys.map(k => byMonth[k]);
          const chart = new Chart(ctx, { type: 'line', data: { labels, datasets: [{ label: 'Pedidos (por mês)', data, borderColor: '#28a745', backgroundColor: 'rgba(40,167,69,0.08)', tension: 0.25 }] }, options: { responsive: true } });
          chartInstances.push(chart);
        }

        // users weekly (simple demo: use usersCount split into 4 weeks evenly)
        if (chartUsersRef.current) {
          const ctx = chartUsersRef.current.getContext('2d');
          const totalUsers = usersCount || 0;
          const perWeek = [Math.floor(totalUsers*0.1), Math.floor(totalUsers*0.2), Math.floor(totalUsers*0.3), Math.max(0, totalUsers - Math.floor(totalUsers*0.6))];
          const chart = new Chart(ctx, { type: 'bar', data: { labels: ['Week 1','Week 2','Week 3','Week 4'], datasets: [{ label: 'Novos usuários', data: perWeek, backgroundColor: '#17a2b8' }] }, options: { responsive: true } });
          chartInstances.push(chart);
        }
      } catch (err) {
        console.warn('Failed to render charts', err);
      }
    })();

    return () => { chartInstances.forEach(c => c?.destroy && c.destroy()); };
  }, [orders, usersCount]);

  function filterOrdersByRange() {
    if (!startDate && !endDate) return orders;
    const s = startDate ? new Date(startDate) : null;
    const e = endDate ? new Date(endDate) : null;
    return (orders || []).filter(o => {
      const dstr = o.data_pedido ? String(o.data_pedido).slice(0,10) : '';
      if (!dstr) return false;
      const d = new Date(dstr);
      if (s && d < s) return false;
      if (e && d > e) return false;
      return true;
    });
  }

  const filtered = filterOrdersByRange();
  return (
    <div className={styles.reportsWrap}>
      <div className={styles.headerRow}>
        <h2>Relatórios</h2>
        <p className={styles.subtitle}>Visão geral dos principais indicadores</p>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <label style={{ fontSize: 14 }}>Início: <input type="date" value={startDate ?? ''} onChange={(e) => setStartDate(e.target.value || null)} /></label>
        <label style={{ fontSize: 14 }}>Fim: <input type="date" value={endDate ?? ''} onChange={(e) => setEndDate(e.target.value || null)} /></label>
        <button onClick={() => { /* no-op, charts update automatically */ }} style={{ padding: '6px 10px', borderRadius: 6 }}>Filtrar</button>
      </div>

      {error && <div style={{ color: 'red' }}>Erro ao carregar dados: {error}</div>}
      {loading && <div>Carregando dados...</div>}

      <div className={styles.cardsRow}>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>Pedidos (total)</div>
          <div className={styles.statValue}>{ordersCount ?? '—'}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>Usuários totais</div>
          <div className={styles.statValue}>{usersCount ?? '—'}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>Pedidos cancelados</div>
          <div className={styles.statValue}>{cancelledCount ?? '—'}</div>
        </div>
      </div>

      <div className={styles.chartsRow}>
        <div className={styles.cardBox}>
          <div className={styles.cardHeader}>Pedidos por mês</div>
          <div className={styles.cardBody}>
            <canvas ref={chartOrdersRef} />
          </div>
        </div>

        <div className={styles.cardBox}>
          <div className={styles.cardHeader}>Novos usuários (estimado)</div>
          <div className={styles.cardBody}>
            <canvas ref={chartUsersRef} />
          </div>
        </div>
      </div>

      <div className={styles.tableRow}>
        <div className={styles.cardBoxFull}>
          <div className={styles.cardHeader}>Pedidos recentes</div>
          <div className={styles.cardBody}>
            <table className={styles.simpleTable}>
              <thead>
                <tr><th>ID</th><th>Cliente</th><th>Data</th><th>Valor</th><th>Status</th></tr>
              </thead>
              <tbody>
                {(filtered || []).slice(0, 15).map((o) => (
                  <tr key={String(o.id || Math.random())}>
                    <td>{o.id}</td>
                    <td>{o.nome_cliente ?? (o.usuario && o.usuario.nome) ?? '—'}</td>
                    <td>{String(o.data_pedido ?? o.data_entrega ?? '').slice(0, 10)}</td>
                    <td>{typeof o.total === 'number' ? `R$ ${Number(o.total).toFixed(2)}` : (o.total ?? '—')}</td>
                    <td>{String(o.status ?? '—')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
