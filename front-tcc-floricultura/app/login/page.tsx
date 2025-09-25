"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../styles/Login.module.css';
import { login } from '../../services/authService';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = await login(email, senha);
    if (!res.success) {
      setError(res.message || 'Erro ao fazer login');
      return;
    }
    // Persistir usuário no localStorage para uso em pedidos
    try {
      // O backend retorna `usuario` (Português). Suporta ambos os formatos para compatibilidade.
      const u = (res as any).usuario || (res as any).user;
      if (u) {
        localStorage.setItem('usuario', JSON.stringify(u));
      }
    } catch (err) {
      console.warn('Não foi possível salvar usuário no localStorage', err);
    }
    // Redirecionar para a home ou dashboard
    router.push('/');
  }

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2>Login</h2>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="Senha" value={senha} onChange={e => setSenha(e.target.value)} required />
        {error && <span className={styles.error}>{error}</span>}
        <button type="submit">Entrar</button>
        <span className={styles.link} onClick={() => router.push('/cadastro')}>Cadastre-se</span>
      </form>
    </div>
  );
}
