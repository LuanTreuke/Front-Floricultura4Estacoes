"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../../styles/ProductOrder.module.css';
import { createAddress } from '../../../services/addressService';

export default function CadastroEnderecoPage() {
  const router = useRouter();
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cep, setCep] = useState('');
  const [cidade, setCidade] = useState('');
  const [complemento, setComplemento] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
  // obter usuário atual a partir do helper centralizado
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getCurrentUser } = require('../../../services/authService');
    const usuario: any = getCurrentUser() || { id: 0 };
    const dto = {
      rua, numero, bairro, cep, cidade, complemento,
      Usuario_id: (typeof usuario?.id === 'number' && usuario.id > 0) ? usuario.id : null,
    };
  // eslint-disable-next-line no-console
  console.debug('[CadastroEnderecoPage] getCurrentUser ->', (require('../../../services/authService')).getCurrentUser());
  // eslint-disable-next-line no-console
  console.debug('[CadastroEnderecoPage] localStorage.usuario raw ->', localStorage.getItem('usuario'));
    setLoading(true);
    try {
      await createAddress(dto as any);
        setMessage('Endereço criado com sucesso');
      setTimeout(() => router.push('/'), 1200);
    } catch (err) {
    console.error('createAddress error', err);
    const msg = (err as any)?.message || String(err);
    setMessage(msg || 'Erro ao criar endereço');
    } finally { setLoading(false); }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Cadastrar endereço</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label>Rua</label>
        <input className={styles.input} value={rua} onChange={e => setRua(e.target.value)} required />
        <label>Número</label>
        <input className={styles.input} value={numero} onChange={e => setNumero(e.target.value)} required />
        <label>Bairro</label>
        <input className={styles.input} value={bairro} onChange={e => setBairro(e.target.value)} required />
        <label>CEP</label>
        <input className={styles.input} value={cep} onChange={e => setCep(e.target.value)} required />
        <label>Cidade</label>
        <input className={styles.input} value={cidade} onChange={e => setCidade(e.target.value)} required />
        <label>Complemento</label>
        <input className={styles.input} value={complemento} onChange={e => setComplemento(e.target.value)} />
        <div className={styles.actions}>
          <button type="submit" className={styles.primaryBtn} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
          <button type="button" className={styles.secondaryBtn} onClick={() => router.back()}>Cancelar</button>
        </div>
        {message && <div style={{ marginTop: 8 }}>{message}</div>}
      </form>
    </div>
  );
}
