"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { fetchProductById, Product } from '../../../../services/productService';
import { fetchAddresses, AddressDto } from '../../../../services/addressService';
import { fetchPhones, PhoneDto } from '../../../../services/phoneService';
import { getCurrentUser, User } from '../../../../services/authService';
import { createOrder, CreateOrderDto } from '../../../../services/orderService';
import styles from '../../../../styles/ProductOrder.module.css';

export default function ProductOrderPage() {
  const params = useParams();
  const id = Number(params?.id);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [phones, setPhones] = useState<PhoneDto[]>([]);
  const [selectedPhoneId, setSelectedPhoneId] = useState<number | null>(null);
  const [nomeCliente, setNomeCliente] = useState('');
  const [telefone, setTelefone] = useState('');
  const [nomeDestinatario, setNomeDestinatario] = useState('');
  const [dataEntrega, setDataEntrega] = useState('');
  const [horaEntrega, setHoraEntrega] = useState('');
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [cobrarNoEndereco, _setCobrarNoEndereco] = useState(false);
  const [observacao, setObservacao] = useState('');
  const [orderQuantity, setOrderQuantity] = useState<number>(1);

  useEffect(() => {
    fetchProductById(id).then(p => { setProduct(p); setLoading(false); });
    (async () => {
      const usuario = getCurrentUser() as User;
      const all = await fetchAddresses();
      if (usuario && usuario.id) {
        setAddresses((all || []).filter((a) => a.Usuario_id === usuario.id));
        // prefills com os dados do usuário logado quando disponíveis
        if (usuario.nome) setNomeCliente(usuario.nome);
        if (usuario.telefone) setTelefone(usuario.telefone);
      } else {
        setAddresses([]);
      }
      // fetch phones for select
      try {
        const ph = await fetchPhones();
        setPhones(ph || []);
        const saved = localStorage.getItem('checkout_selected_phone');
        if (saved) {
          const parsed = Number(saved);
          if (!Number.isNaN(parsed)) {
            setSelectedPhoneId(parsed);
            const chosen = (ph || []).find((x) => x.id === parsed);
            if (chosen && chosen.telefone) setTelefone(chosen.telefone);
          }
        }
      } catch {
        // ignore
      }
    })();
  }, [id]);

  useEffect(() => {
    if (selectedPhoneId === null) {
      localStorage.removeItem('checkout_selected_phone');
    } else {
      localStorage.setItem('checkout_selected_phone', String(selectedPhoneId));
    }
  }, [selectedPhoneId]);

  async function handlePedido(e: React.FormEvent) {
    e.preventDefault();
  const usuario = getCurrentUser() || ({ id: 0, nome: '', telefone: '' } as User);
  console.debug('[ProductOrderPage] getCurrentUser ->', usuario);
  console.debug('[ProductOrderPage] localStorage.usuario raw ->', typeof window !== 'undefined' ? localStorage.getItem('usuario') : null);
    // prepare product item early so validation can check it
    const prodItem = product ? {
      id: product.id,
      nome: product.nome,
      preco: product.preco,
      quantidade: orderQuantity || 1,
      imagem_url: product.imagem_url || null,
    } : null;
    const missing: string[] = [];
    if (!selectedAddress) missing.push('selectedAddress');
    // require logged in user
    if (!usuario || !usuario.id) {
      if (confirm('Você precisa estar logado para finalizar. Ir para login?')) router.push('/login');
      return;
    }
    if (!nomeCliente || !nomeCliente.trim()) missing.push('nomeCliente');
    if (!telefone || !telefone.trim()) missing.push('telefone');
    if (!nomeDestinatario || !nomeDestinatario.trim()) missing.push('nomeDestinatario');
    if (!dataEntrega) missing.push('dataEntrega');
    if (!horaEntrega) missing.push('horaEntrega');
    if (missing.length > 0) {
      const errObj: Record<string, boolean> = {};
      missing.forEach(m => { errObj[m] = true; });
      setErrors(prev => ({ ...prev, ...errObj }));
      alert('Preencha os campos obrigatórios');
      return;
    }
    // ensure prodItem present
    if (!prodItem) { alert('Produto inválido'); return; }
    // validate delivery date/time if provided
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
    // quando o pedido é feito diretamente da página do produto, vamos
    // serializar as informações do produto dentro do campo `carrinho` (campo novo no DB)
    // e deixar `observacao` apenas para a nota textual.
  const carrinhoPayload = prodItem ? { cart: [prodItem] } : {} as Record<string, unknown>;
    if (observacao && typeof observacao === 'string' && observacao.trim().length > 0) carrinhoPayload.nota = observacao;

    const dto = {
      nome_destinatario: nomeDestinatario,
      data_entrega: dataEntrega || undefined,
      hora_entrega: horaEntrega || undefined,
      nome_cliente: nomeCliente || usuario.nome || '',
      // não enviar telefone do usuário automaticamente quando o campo do pedido for deixado em branco
      telefone_cliente: telefone && telefone.trim().length ? telefone : undefined,
  // armazenamos o carrinho como string no novo campo `carrinho`; observacao permanece apenas texto
  carrinho: Object.keys(carrinhoPayload).length ? JSON.stringify(carrinhoPayload) : undefined,
  observacao: observacao && observacao.trim().length ? observacao : undefined,
      cobrar_no_endereco: cobrarNoEndereco,
      Endereco_id: selectedAddress,
      Usuario_id: (typeof usuario?.id === 'number' && usuario.id > 0) ? usuario.id : null,
    };
    try {
      await createOrder(dto as CreateOrderDto);
      alert('Pedido criado com sucesso');
      router.push('/');
    } catch (err) {
      console.error(err);
      alert('Erro ao criar pedido');
    }
  }

  if (loading) return <div className={styles.container}>Carregando...</div>;
  if (!product) return <div className={styles.container}>Produto não encontrado</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Fazer pedido — {product.nome}</h1>
      <div className={styles.card}>
        {product.imagem_url ? (
          <Image src={product.imagem_url} alt={product.nome} className={styles.image} width={400} height={400} style={{ objectFit: 'cover' }} />
        ) : (
          <div className={styles.image}>Img</div>
        )}
        <div className={styles.info}>
          <p className={styles.price}>R${Number(product.preco).toFixed(2)}</p>
          <form onSubmit={handlePedido} className={styles.form}>
            <label>Nome</label>
            <input className={`${styles.input} ${errors.nomeCliente ? styles.invalid : ''}`} value={nomeCliente} onChange={e => { setNomeCliente(e.target.value); setErrors(prev => ({ ...prev, nomeCliente: false })); }} placeholder="Seu nome" />
            <label>Telefone</label>
            <select className={`${styles.select} ${errors.telefone ? styles.invalid : ''}`} value={selectedPhoneId || ''} onChange={e => {
              const val = e.target.value;
              if (!val) {
                setSelectedPhoneId(null);
                setTelefone('');
                return;
              }
              const id = Number(val);
              setSelectedPhoneId(id);
              const chosen = (phones || []).find(p => p.id === id);
              if (chosen && chosen.telefone) setTelefone(chosen.telefone);
              setErrors(prev => ({ ...prev, telefone: false }));
            }}>
              <option value="">Outro / selecionar</option>
              {phones.map(p => (
                <option key={p.id} value={p.id}>{p.telefone}</option>
              ))}
            </select>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button type="button" className={styles.secondaryBtn} onClick={() => router.push('/cadastro/telefone')}>+ Adicionar telefone</button>
            </div>

            <label>Endereço</label>
            <select className={`${styles.select} ${errors.selectedAddress ? styles.invalid : ''}`} value={selectedAddress || ''} onChange={e => { setSelectedAddress(Number(e.target.value)); setErrors(prev => ({ ...prev, selectedAddress: false })); }}>
              <option value="">Selecione</option>
              {addresses.map(a => (
                <option key={a.id} value={a.id}>{`${a.rua}, ${a.numero} - ${a.bairro}`}</option>
              ))}
            </select>

            <div style={{ marginTop: 8 }}>
              <button type="button" className={styles.primaryBtn} onClick={() => router.push('/cadastro/endereco')}>
                + Adicionar endereço
              </button>
            </div>

            <label>Nome do destinatário</label>
            <input className={`${styles.input} ${errors.nomeDestinatario ? styles.invalid : ''}`} value={nomeDestinatario} onChange={e => { setNomeDestinatario(e.target.value); setErrors(prev => ({ ...prev, nomeDestinatario: false })); }} placeholder="Nome do destinatário (se diferente)" />

            <label>Data e hora de entrega</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input type="date" className={`${styles.input} ${errors.dataEntrega ? styles.invalid : ''}`} value={dataEntrega} onChange={e => { setDataEntrega(e.target.value); setErrors(prev => ({ ...prev, dataEntrega: false })); }} />
              <input type="time" className={`${styles.input} ${errors.horaEntrega ? styles.invalid : ''}`} value={horaEntrega} onChange={e => { setHoraEntrega(e.target.value); setErrors(prev => ({ ...prev, horaEntrega: false })); }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input id="cobrarNoEndereco" type="checkbox" checked={cobrarNoEndereco} onChange={e => _setCobrarNoEndereco(e.target.checked)} />
              <label htmlFor="cobrarNoEndereco">Cobrar no endereço</label>
            </div>

            <label>Observação</label>
            <textarea className={styles.textarea} value={observacao} onChange={e => setObservacao(e.target.value)} rows={4} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
              <label style={{ fontSize: 14 }}>Quantidade</label>
              <input type="number" min={1} value={orderQuantity} onChange={e => setOrderQuantity(Number(e.target.value) || 1)} className={styles.input} style={{ width: 90 }} />
              <div style={{ marginLeft: "auto", }}>Total: R${Number((product?.preco || 0) * orderQuantity).toFixed(2)}</div>
            </div>
              
            <div className={styles.actions} style={{ justifyContent: 'flex-end', gap: 12 }}>
              <button type="submit" className={styles.primaryBtn}>Confirmar pedido</button>
              <button type="button" onClick={() => router.back()} className={styles.secondaryBtn}>Voltar</button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
