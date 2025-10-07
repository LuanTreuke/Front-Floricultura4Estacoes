"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../styles/ProductOrder.module.css';
import { getCart, clearCart, cartTotal } from '../../services/cartService';
import { fetchAddresses, AddressDto } from '../../services/addressService';
import { getCurrentUser } from '../../services/authService';
import { createOrder } from '../../services/orderService';

export default function UnifiedOrderPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [nomeCliente, setNomeCliente] = useState('');
  const [telefone, setTelefone] = useState('');
  const [nomeDestinatario, setNomeDestinatario] = useState('');
  const [dataEntrega, setDataEntrega] = useState('');
  const [horaEntrega, setHoraEntrega] = useState('');
  const [observacao, setObservacao] = useState('');
  const [cobrarNoEndereco, setCobrarNoEndereco] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const c = getCart();
    setItems(c);
    const usuario: any = getCurrentUser();
    if (usuario) {
      setNomeCliente(usuario.nome || '');
      setTelefone(usuario.telefone || '');
    }
    (async () => {
      const all = await fetchAddresses();
      const my = (all || []).filter((a: any) => a.Usuario_id === (usuario && usuario.id));
      setAddresses(my);
      try {
        const pref = localStorage.getItem('checkout_selected_address');
        if (pref) setSelectedAddress(Number(pref));
        else if (my.length > 0) setSelectedAddress(my[0].id || null);
      } catch (err) { if (my.length > 0) setSelectedAddress(my[0].id || null); }
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return alert('Carrinho vazio');
    if (!selectedAddress) return alert('Selecione um endereço');
    const usuario: any = getCurrentUser();
    if (!usuario || !usuario.id) {
      if (confirm('Você precisa estar logado para finalizar. Ir para login?')) router.push('/login');
      return;
    }

    setLoading(true);
    try {
      // include cart items in observacao along with user's text
      const cartPayload = items.map(i => ({ id: i.id, nome: i.nome, preco: i.preco, quantidade: i.quantidade }));
      const dto: any = {
        observacao: JSON.stringify({ cart: cartPayload, nota: observacao }),
        Endereco_id: selectedAddress,
        Usuario_id: usuario.id,
        nome_cliente: nomeCliente || usuario.nome || '',
        telefone_cliente: telefone || usuario.telefone || '',
        data_entrega: dataEntrega || undefined,
        hora_entrega: horaEntrega || undefined,
        nome_destinatario: nomeDestinatario || undefined,
        cobrar_no_endereco: cobrarNoEndereco || false,
      };
      await createOrder(dto);
      clearCart();
      setItems([]);
      alert('Pedido criado com sucesso');
      router.push('/');
    } catch (e: any) {
      console.error(e);
      alert('Erro ao criar pedido: ' + (e.message || String(e)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Finalizar pedido</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label>Endereço</label>
        <select className={styles.select} value={selectedAddress || ''} onChange={e => setSelectedAddress(Number(e.target.value))}>
          <option value="">Selecione</option>
          {addresses.map(a => <option key={a.id} value={a.id}>{`${a.rua}, ${a.numero} - ${a.bairro}`}</option>)}
        </select>

        <label>Nome</label>
        <input className={styles.input} value={nomeCliente} onChange={e => setNomeCliente(e.target.value)} />

        <label>Telefone</label>
        <input className={styles.input} value={telefone} onChange={e => setTelefone(e.target.value)} />

        <label>Nome do destinatário</label>
        <input className={styles.input} value={nomeDestinatario} onChange={e => setNomeDestinatario(e.target.value)} />

        <label>Data de entrega</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="date" className={styles.input} value={dataEntrega} onChange={e => setDataEntrega(e.target.value)} />
          <input type="time" className={styles.input} value={horaEntrega} onChange={e => setHoraEntrega(e.target.value)} />
        </div>

        <label>Observação</label>
        <textarea className={styles.textarea} value={observacao} onChange={e => setObservacao(e.target.value)} rows={4} />

        <div style={{ marginTop: 12 }}>
          <button type="submit" className={styles.primaryBtn} disabled={loading}>Confirmar pedido ({items.length} itens) - Total R$ {Number(cartTotal()).toFixed(2)}</button>
        </div>
      </form>

      <div style={{ marginTop: 20 }}>
        <h3>Itens no pedido</h3>
        {items.map(it => (
          <div key={it.id} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
            <img src={it.imagem_url || '/bouquet1.jpg'} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{it.nome}</div>
              <div>R$ {Number(it.preco).toFixed(2)} x {it.quantidade}</div>
            </div>
          </div>
        ))}
+      </div>
    </div>
  );
}
