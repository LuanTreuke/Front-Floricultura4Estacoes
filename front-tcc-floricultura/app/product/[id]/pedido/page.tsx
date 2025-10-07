"use client";
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchProductById, Product } from '../../../../services/productService';
import { fetchAddresses, AddressDto, createAddress } from '../../../../services/addressService';
import { createOrder } from '../../../../services/orderService';
import styles from '../../../../styles/ProductOrder.module.css';

export default function ProductOrderPage() {
  const params = useParams();
  const id = Number(params?.id);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [nomeCliente, setNomeCliente] = useState('');
  const [telefone, setTelefone] = useState('');
  const [nomeDestinatario, setNomeDestinatario] = useState('');
  const [dataEntrega, setDataEntrega] = useState('');
  const [horaEntrega, setHoraEntrega] = useState('');
  const [cobrarNoEndereco, setCobrarNoEndereco] = useState(false);
  const [observacao, setObservacao] = useState('');
  const [newAddressText, setNewAddressText] = useState('');
  const [addMessage, setAddMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchProductById(id).then(p => { setProduct(p); setLoading(false); });
    (async () => {
      const { getCurrentUser } = require('../../../../services/authService');
      const usuario: any = getCurrentUser();
      const all = await fetchAddresses();
      if (usuario && usuario.id) {
        setAddresses((all || []).filter((a: any) => a.Usuario_id === usuario.id));
        // prefills com os dados do usuário logado quando disponíveis
        if (usuario.nome) setNomeCliente(usuario.nome);
        if (usuario.telefone) setTelefone(usuario.telefone);
      } else {
        setAddresses([]);
      }
    })();
  }, [id]);

  async function handlePedido(e: React.FormEvent) {
    e.preventDefault();
  const { getCurrentUser } = require('../../../../services/authService');
  const usuario: any = getCurrentUser() || { id: 0, nome: '', telefone: '' };
  // eslint-disable-next-line no-console
  console.debug('[ProductOrderPage] getCurrentUser ->', usuario);
  // eslint-disable-next-line no-console
  console.debug('[ProductOrderPage] localStorage.usuario raw ->', localStorage.getItem('usuario'));
    if (!selectedAddress) {
      alert('Selecione um endereço ou cadastre um');
      return;
    }
    // quando o pedido é feito diretamente da página do produto, vamos
    // serializar as informações do produto dentro do campo `observacao`
    // no formato esperado pelo painel admin: { cart: [ { id, nome, preco, quantidade, imagem_url }, ... ], nota }
    const prodItem = product ? {
      id: product.id,
      nome: product.nome,
      preco: product.preco,
      quantidade: 1,
      imagem_url: product.imagem_url || null,
    } : null;

    const observacaoPayload: any = prodItem ? { cart: [prodItem] } : {};
    if (observacao && typeof observacao === 'string' && observacao.trim().length > 0) observacaoPayload.nota = observacao;

    const dto = {
      nome_destinatario: nomeDestinatario,
      data_entrega: dataEntrega || undefined,
      hora_entrega: horaEntrega || undefined,
      nome_cliente: nomeCliente || usuario.nome || '',
      telefone_cliente: telefone || usuario.telefone || '',
      // armazenamos a payload como string para manter compatibilidade com o backend
      observacao: Object.keys(observacaoPayload).length ? JSON.stringify(observacaoPayload) : undefined,
      cobrar_no_endereco: cobrarNoEndereco,
      Endereco_id: selectedAddress,
      Usuario_id: (typeof usuario?.id === 'number' && usuario.id > 0) ? usuario.id : null,
    };
    try {
      await createOrder(dto as any);
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
        <img src={product.imagem_url || '/bouquet1.jpg'} alt={product.nome} className={styles.image} />
        <div className={styles.info}>
          <p className={styles.price}>R${Number(product.preco).toFixed(2)}</p>
          <form onSubmit={handlePedido} className={styles.form}>
            <label>Nome</label>
            <input className={styles.input} value={nomeCliente} onChange={e => setNomeCliente(e.target.value)} placeholder="Seu nome" />
            <label>Telefone</label>
            <input className={styles.input} value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="Telefone" />

            <label>Endereço</label>
            <select className={styles.select} value={selectedAddress || ''} onChange={e => setSelectedAddress(Number(e.target.value))}>
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
            <input className={styles.input} value={nomeDestinatario} onChange={e => setNomeDestinatario(e.target.value)} placeholder="Nome do destinatário (se diferente)" />

            <label>Data e hora de entrega</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input type="date" className={styles.input} value={dataEntrega} onChange={e => setDataEntrega(e.target.value)} />
              <input type="time" className={styles.input} value={horaEntrega} onChange={e => setHoraEntrega(e.target.value)} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input id="cobrarNoEndereco" type="checkbox" checked={cobrarNoEndereco} onChange={e => setCobrarNoEndereco(e.target.checked)} />
              <label htmlFor="cobrarNoEndereco">Cobrar no endereço</label>
            </div>

            <label>Observação</label>
            <textarea className={styles.textarea} value={observacao} onChange={e => setObservacao(e.target.value)} rows={4} />

            <div className={styles.actions}>
              <button type="submit" className={styles.primaryBtn}>Confirmar pedido</button>
              <button type="button" onClick={() => router.back()} className={styles.secondaryBtn}>Voltar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
