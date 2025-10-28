"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../../styles/ProductOrder.module.css';
import { createPhone, PhoneDto } from '../../../services/phoneService';
import { getCurrentUser, User } from '../../../services/authService';

export default function CadastroTelefonePage() {
  const router = useRouter();
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const usuario = getCurrentUser() as User | null;
    const dto: PhoneDto = {
      telefone,
      Usuario_id: (typeof usuario?.id === 'number' && usuario.id > 0) ? usuario.id : null,
    };
    setLoading(true);
    try {
  await createPhone(dto);
      setMessage('Telefone cadastrado com sucesso');
      setTimeout(() => router.push('/'), 1200);
    } catch (err: unknown) {
      console.error('createPhone error', err);
      const msg = (err instanceof Error) ? err.message : String(err);
      setMessage(msg || 'Erro ao cadastrar telefone');
    } finally { setLoading(false); }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Cadastrar telefone</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label>Telefone (somente números, sem o 9 antes do telefone)</label>
        <input className={styles.input} value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="5542xxxxxxxx" required />
        <div className={styles.actions}>
          <button type="submit" className={styles.primaryBtn} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
          <button type="button" className={styles.secondaryBtn} onClick={() => router.back()}>Cancelar</button>
        </div>
        {message && <div style={{ marginTop: 8 }}>{message}</div>}
      </form>
    </div>
  );
}
