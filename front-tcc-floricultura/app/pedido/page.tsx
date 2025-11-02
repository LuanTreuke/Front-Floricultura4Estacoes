/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from '../../styles/ProductOrder.module.css';
import { getCart, clearCart, cartTotal, CartItem } from '../../services/cartService';
import { fetchAddresses, AddressDto } from '../../services/addressService';
import { fetchPhones } from '../../services/phoneService';
import { getCurrentUser, User } from '../../services/authService';
import { createOrder } from '../../services/orderService';
import BackButton from '../../components/BackButton';

export default function UnifiedOrderPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [nomeCliente, setNomeCliente] = useState('');
  const [hasUsuarioTelefone, setHasUsuarioTelefone] = useState<boolean | null>(null);
  const [nomeDestinatario, setNomeDestinatario] = useState('');
  const [dataEntrega, setDataEntrega] = useState('');
  const [horaEntrega, setHoraEntrega] = useState('');
  const [observacao, setObservacao] = useState('');
  const cobrarNoEndereco = false;
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const c = getCart();
    setItems(c);
    // compute total only on client after mount to avoid SSR/client mismatch
  try { setTotal(cartTotal()); } catch { setTotal(0); }
    const usuario = getCurrentUser() as User;
    if (usuario) {
      setNomeCliente(usuario.nome || '');
      // não definir hasUsuarioTelefone aqui para evitar piscar; aguardar checagem do servidor
    }
    (async () => {
      const all = await fetchAddresses();
      const my = (all || []).filter((a) => a.Usuario_id === (usuario && usuario.id));
      setAddresses(my);
      try {
        const pref = localStorage.getItem('checkout_selected_address');
        if (pref) setSelectedAddress(Number(pref));
        else if (my.length > 0) setSelectedAddress(my[0].id || null);
      } catch { if (my.length > 0) setSelectedAddress(my[0].id || null); }
      // checar telefone no servidor (não depender apenas do localStorage)
      try {
        const phones = await fetchPhones();
        setHasUsuarioTelefone(Array.isArray(phones) && phones.length > 0 ? true : !!(usuario as any)?.telefone);
      } catch { /* ignore */ }
    })();
    // revalidar ao voltar o foco para a aba (após cadastro de telefone)
    const onFocus = async () => {
      try {
        const phones = await fetchPhones();
        setHasUsuarioTelefone(Array.isArray(phones) && phones.length > 0);
      } catch { /* ignore */ }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', onFocus);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') onFocus();
      });
    }
    return () => {
      if (typeof window !== 'undefined') window.removeEventListener('focus', onFocus);
    };
  }, []);

  // phone selection removed

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
      } catch {
        alert('Erro ao validar data/hora de entrega');
        return;
      }
    }

    setLoading(true);
  // validate required fields (all except observacao)
  const missing: string[] = [];
  if (!nomeCliente || !nomeCliente.trim()) missing.push('nomeCliente');
  if (!nomeDestinatario || !nomeDestinatario.trim()) missing.push('nomeDestinatario');
  if (!dataEntrega) missing.push('dataEntrega');
  if (!horaEntrega) missing.push('horaEntrega');
  if (!selectedAddress) missing.push('selectedAddress');
  if (hasUsuarioTelefone === false) {
    alert('Para finalizar o pedido, cadastre um telefone de contato.');
    setLoading(false);
    return;
  }
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
        telefone_cliente: (usuario as any)?.telefone || undefined,
        data_entrega: dataEntrega || undefined,
        hora_entrega: horaEntrega || undefined,
        nome_destinatario: nomeDestinatario || undefined,
        cobrar_no_endereco: cobrarNoEndereco || false,
      };
  console.debug('[UnifiedOrderPage] createOrder DTO ->', dto);
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
      <BackButton />
      <h1 className={styles.heading } style={{ marginTop: 24, fontSize: 30 }}>Finalizar pedido</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label>Endereço</label>
          <select className={`${styles.select} ${errors.selectedAddress ? styles.invalid : ''}`} value={selectedAddress || ''} onChange={e => { setSelectedAddress(Number(e.target.value)); setErrors(prev => ({ ...prev, selectedAddress: false })); try { localStorage.setItem('checkout_selected_address', String(Number(e.target.value))); } catch {} }}>
          <option value="">Selecione</option>
          {addresses.map(a => <option key={a.id} value={a.id}>{`${a.rua}, ${a.numero} - ${a.bairro}`}</option>)}
        </select>

        <div style={{ marginTop: 8 }}>
          <button type="button" className={styles.primaryBtn} onClick={() => router.push('/cadastro/endereco')}>
            + Adicionar endereço
          </button>
        </div>

        <label>Nome</label>
  <input className={`${styles.input} ${errors.nomeCliente ? styles.invalid : ''}`} value={nomeCliente} onChange={e => { setNomeCliente(e.target.value); setErrors(prev => ({ ...prev, nomeCliente: false })); }} />

        {/* Aviso de telefone ausente */}
        {hasUsuarioTelefone === false && (
          <div style={{ background: '#fffaf0', border: '1px solid #ffe4a3', padding: 10, borderRadius: 8, color: '#7a4b00' }}>
            <div style={{ marginBottom: 6 }}>Você ainda não tem um telefone cadastrado. Cadastre para prosseguir.</div>
            <button type="button" className={styles.secondaryBtn} onClick={() => router.push('/cadastro/telefone/novo?returnTo=/pedido')}>
              Adicionar telefone
            </button>
          </div>
        )}

        <label>Nome do destinatário</label>
  <input className={`${styles.input} ${errors.nomeDestinatario ? styles.invalid : ''}`} value={nomeDestinatario} onChange={e => { setNomeDestinatario(e.target.value); setErrors(prev => ({ ...prev, nomeDestinatario: false })); }} />

        <label>Data de entrega</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="date" className={`${styles.input} ${errors.dataEntrega ? styles.invalid : ''}`} value={dataEntrega} onChange={e => { setDataEntrega(e.target.value); setErrors(prev => ({ ...prev, dataEntrega: false })); }} />
          <input type="time" className={`${styles.input} ${errors.horaEntrega ? styles.invalid : ''}`} value={horaEntrega} onChange={e => { setHoraEntrega(e.target.value); setErrors(prev => ({ ...prev, horaEntrega: false })); }} />
        </div>

        <label>Observação</label>
        <textarea className={styles.textarea} value={observacao} onChange={e => setObservacao(e.target.value)} rows={4} />

        {hasUsuarioTelefone !== false && (
          <div style={{ marginTop: 12 }}>
            <button type="submit" className={styles.primaryBtn} disabled={loading}>Confirmar pedido ({items.length} itens) - Total R$ {Number(total).toFixed(2)}</button>
          </div>
        )}
      </form>

      <div style={{ marginTop: 20 }}>
        <h3>Itens no pedido</h3>
        {items.map(it => (
          <div key={it.id} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
            {it.imagem_url ? (
              <Image src={it.imagem_url} alt={it.nome || ''} width={64} height={64} style={{ objectFit: 'cover', borderRadius: 8 }} />
            ) : (
              <div style={{ width: 64, height: 64, background: '#f3f3f3', borderRadius: 8 }} />
            )}
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
