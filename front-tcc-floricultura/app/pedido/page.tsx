"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../styles/ProductOrder.module.css';
import { getCart, clearCart, cartTotal, CartItem } from '../../services/cartService';
import { fetchAddresses, AddressDto } from '../../services/addressService';
import { fetchPhones, PhoneDto } from '../../services/phoneService';
import { getCurrentUser, User } from '../../services/authService';
import { createOrder } from '../../services/orderService';

export default function UnifiedOrderPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [phones, setPhones] = useState<PhoneDto[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [selectedPhoneId, setSelectedPhoneId] = useState<number | null>(null);
  const [nomeCliente, setNomeCliente] = useState('');
  const [telefone, setTelefone] = useState('');
  const [nomeDestinatario, setNomeDestinatario] = useState('');
  const [dataEntrega, setDataEntrega] = useState('');
  const [horaEntrega, setHoraEntrega] = useState('');
  const [observacao, setObservacao] = useState('');
  const [cobrarNoEndereco, setCobrarNoEndereco] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const c = getCart();
    setItems(c);
    // compute total only on client after mount to avoid SSR/client mismatch
    try { setTotal(cartTotal()); } catch (e) { setTotal(0); }
    const usuario = getCurrentUser() as User;
    if (usuario) {
      setNomeCliente(usuario.nome || '');
      setTelefone(usuario.telefone || '');
    }
    (async () => {
  const all = await fetchAddresses();
  const my = (all || []).filter((a) => a.Usuario_id === (usuario && usuario.id));
      setAddresses(my);
      // phones
  const allPhones = await fetchPhones();
  const myPhones = (allPhones || []).filter((p) => p.Usuario_id === (usuario && usuario.id));
      setPhones(myPhones);
      try {
        const prefPhone = localStorage.getItem('checkout_selected_phone');
        if (prefPhone) setSelectedPhoneId(Number(prefPhone));
        else if (myPhones.length > 0) setSelectedPhoneId(myPhones[0].id || null);
      } catch (err) { if (myPhones.length > 0) setSelectedPhoneId(myPhones[0].id || null); }
      try {
        const pref = localStorage.getItem('checkout_selected_address');
        if (pref) setSelectedAddress(Number(pref));
        else if (my.length > 0) setSelectedAddress(my[0].id || null);
      } catch (err) { if (my.length > 0) setSelectedAddress(my[0].id || null); }
    })();
  }, []);

  // keep telefone input in sync when selectedPhoneId changes and persist pref
  useEffect(() => {
    try {
      if (selectedPhoneId === null || selectedPhoneId === undefined) {
        localStorage.removeItem('checkout_selected_phone');
      } else {
        localStorage.setItem('checkout_selected_phone', String(selectedPhoneId));
      }
    } catch (e) {
      // ignore storage errors
    }
    const chosen = phones.find(p => p.id === selectedPhoneId);
    if (chosen && chosen.telefone) {
      setTelefone(chosen.telefone);
    }
  }, [selectedPhoneId, phones]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return alert('Carrinho vazio');
    if (!selectedAddress) {
      setErrors(prev => ({ ...prev, selectedAddress: true }));
      return alert('Selecione um endereço');
    }
    const usuario = getCurrentUser() as User;
    if (!usuario || !usuario.id) {
      if (confirm('Você precisa estar logado para finalizar. Ir para login?')) router.push('/login');
      return;
    }

  // validate delivery date/time: if a delivery date is selected, the combined
    // date+time must not be before the current datetime.
    if (dataEntrega) {
      try {
        let timePart = (horaEntrega && horaEntrega.trim().length) ? horaEntrega.trim() : '23:59';
        if (timePart.length === 5) timePart = timePart + ':00';
        const delivery = new Date(`${dataEntrega}T${timePart}`);
        if (isNaN(delivery.getTime())) {
          alert('Data ou hora de entrega inválida');
          return;
        }
        const now = new Date();
        if (delivery.getTime() < now.getTime()) {
          alert('A data e hora de entrega não podem ser anteriores à data/hora atual');
          return;
        }
      } catch (e) {
        alert('Erro ao validar data/hora de entrega');
        return;
      }
    }

    setLoading(true);
  // validate required fields (all except observacao)
  const missing: string[] = [];
  if (!nomeCliente || !nomeCliente.trim()) missing.push('nomeCliente');
  if (!telefone || !telefone.trim()) missing.push('telefone');
  if (!nomeDestinatario || !nomeDestinatario.trim()) missing.push('nomeDestinatario');
  if (!dataEntrega) missing.push('dataEntrega');
  if (!horaEntrega) missing.push('horaEntrega');
  if (!selectedAddress) missing.push('selectedAddress');
  if (missing.length > 0) {
    const errObj: Record<string, boolean> = {};
    missing.forEach(m => { errObj[m] = true; });
    setErrors(prev => ({ ...prev, ...errObj }));
    alert('Preencha os campos obrigatórios');
    setLoading(false);
    return;
  }
  // ensure cart not empty
  if (!items || items.length === 0) { alert('Carrinho vazio'); setLoading(false); return; }
    try {
      // preparar payload do carrinho e enviar para o campo `carrinho` (string JSON)
      const cartPayload = items.map(i => ({ id: i.id, nome: i.nome, preco: i.preco, quantidade: i.quantidade, imagem_url: i.imagem_url }));
      const carrinhoObj = { cart: cartPayload } as Record<string, unknown>;
      if (observacao && typeof observacao === 'string' && observacao.trim().length > 0) carrinhoObj.nota = observacao;

      const dto = {
        carrinho: JSON.stringify(carrinhoObj),
        observacao: observacao || undefined,
        Endereco_id: selectedAddress,
        Usuario_id: usuario.id,
        nome_cliente: nomeCliente || usuario.nome || '',
        // somente enviar telefone_cliente se o campo tiver valor explícito
        telefone_cliente: telefone && telefone.trim().length ? telefone : undefined,
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
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : String(e);
      alert('Erro ao criar pedido: ' + msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Finalizar pedido</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label>Endereço</label>
        <select className={`${styles.select} ${errors.selectedAddress ? styles.invalid : ''}`} value={selectedAddress || ''} onChange={e => { setSelectedAddress(Number(e.target.value)); setErrors(prev => ({ ...prev, selectedAddress: false })); try { localStorage.setItem('checkout_selected_address', String(Number(e.target.value))); } catch (e) {} }}>
          <option value="">Selecione</option>
          {addresses.map(a => <option key={a.id} value={a.id}>{`${a.rua}, ${a.numero} - ${a.bairro}`}</option>)}
        </select>

        <label>Nome</label>
  <input className={`${styles.input} ${errors.nomeCliente ? styles.invalid : ''}`} value={nomeCliente} onChange={e => { setNomeCliente(e.target.value); setErrors(prev => ({ ...prev, nomeCliente: false })); }} />

        <label>Telefone</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select className={`${styles.select} ${errors.telefone ? styles.invalid : ''}`} value={selectedPhoneId || ''} onChange={e => {
            const id = e.target.value ? Number(e.target.value) : null; setSelectedPhoneId(id);
            const phone = phones.find(p => p.id === id);
            if (phone && phone.telefone) setTelefone(phone.telefone);
            try { localStorage.setItem('checkout_selected_phone', String(id)); } catch (err) {}
            setErrors(prev => ({ ...prev, telefone: false }));
          }}>
            <option value="">Selecione</option>
            {phones.map(p => <option key={p.id} value={p.id}>{p.telefone}</option>)}
          </select>
          <button type="button" className={styles.primaryBtn} onClick={() => router.push('/cadastro/telefone')}>+ Adicionar telefone</button>
        </div>

        <label>Nome do destinatário</label>
  <input className={`${styles.input} ${errors.nomeDestinatario ? styles.invalid : ''}`} value={nomeDestinatario} onChange={e => { setNomeDestinatario(e.target.value); setErrors(prev => ({ ...prev, nomeDestinatario: false })); }} />

        <label>Data de entrega</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="date" className={`${styles.input} ${errors.dataEntrega ? styles.invalid : ''}`} value={dataEntrega} onChange={e => { setDataEntrega(e.target.value); setErrors(prev => ({ ...prev, dataEntrega: false })); }} />
          <input type="time" className={`${styles.input} ${errors.horaEntrega ? styles.invalid : ''}`} value={horaEntrega} onChange={e => { setHoraEntrega(e.target.value); setErrors(prev => ({ ...prev, horaEntrega: false })); }} />
        </div>

        <label>Observação</label>
        <textarea className={styles.textarea} value={observacao} onChange={e => setObservacao(e.target.value)} rows={4} />

        <div style={{ marginTop: 12 }}>
          <button type="submit" className={styles.primaryBtn} disabled={loading}>Confirmar pedido ({items.length} itens) - Total R$ {Number(total).toFixed(2)}</button>
        </div>
      </form>

      <div style={{ marginTop: 20 }}>
        <h3>Itens no pedido</h3>
        {items.map(it => (
          <div key={it.id} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
            <img src={it.imagem_url || ''} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{it.nome}</div>
              <div>R$ {Number(it.preco).toFixed(2)} x {it.quantidade}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
