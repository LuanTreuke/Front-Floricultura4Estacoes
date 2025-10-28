"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../styles/Login.module.css';
import { cadastro } from '../../services/authService';

export default function CadastroPage() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [senha2, setSenha2] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (senha !== senha2) {
      setError('As senhas não coincidem');
      return;
    }
    const res = await cadastro({ nome, email, senha, telefone });
    if (!res.success) {
      setError(res.message || 'Erro ao cadastrar');
      return;
    }
    setSuccess('Cadastro realizado com sucesso!');
    setTimeout(() => router.push('/login'), 1500);
  }

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.logoWrap}>
          <img src="/Logo floricultura.jpg" alt="Logo Floricultura" className={styles.logo} />
        </div>
        <h2>Cadastro</h2>
        <input type="text" placeholder="Nome" value={nome} onChange={e => setNome(e.target.value)} required />
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="text" placeholder="Telefone" value={telefone} onChange={e => setTelefone(e.target.value)} />
        <input type="password" placeholder="Senha" value={senha} onChange={e => setSenha(e.target.value)} required />
        <input type="password" placeholder="Confirmar senha" value={senha2} onChange={e => setSenha2(e.target.value)} required />
        {error && <span className={styles.error}>{error}</span>}
        {success && <span className={styles.success}>{success}</span>}
        <button type="submit">Cadastrar</button>
      </form>
    </div>
  );
}
