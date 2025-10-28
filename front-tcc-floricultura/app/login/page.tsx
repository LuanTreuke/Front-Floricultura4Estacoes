"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../styles/Login.module.css';
import { login } from '../../services/authService';
import { getCart, getCartFromServer } from '../../services/cartService';
// using shared api via services/api.ts (login uses authService)

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
    // Refresh server-backed cart into local cache and remove any guest key
    // so the visible cart is the server cart tied to the authenticated user.
    try {
      try {
        await getCartFromServer();
      } catch (e) { console.warn('refresh server cart failed', e); }
      try { localStorage.removeItem('floricultura_cart_v1'); } catch (e) {}
      try { window.dispatchEvent(new Event('cart-updated')); } catch (e) {}
    } catch (e) { console.warn('post-login cart refresh failed', e); }

    // Redirecionar para a home ou dashboard
    router.push('/');
  }

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.logoWrap}>
          <img src="/Logo floricultura.jpg" alt="Logo Floricultura" className={styles.logo} />
        </div>
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
