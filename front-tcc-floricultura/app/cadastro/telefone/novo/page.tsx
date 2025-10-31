"use client";
import React, { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from '../../../../styles/ProductOrder.module.css';
import Image from 'next/image';
import { getCurrentUser, User } from '../../../../services/authService';
import api from '../../../../services/api';

export default function CadastroTelefoneNovoPage() {
  const router = useRouter();
  const search = useSearchParams();
  // prefer an explicit returnTo query param; if absent, fall back to history.back()
  const returnTo = search?.get('returnTo') || null;
  const usuario = getCurrentUser() as User | null;

  // company WhatsApp number (provided)
  const companyNumber = '554235242223';

  // default message — user can copy/open the prefilled message link
  const [token, setToken] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const defaultMessage = useMemo(() => {
    const emailPart = usuario?.email ? ` (usuário: ${usuario.email})` : '';
    return `Olá, quero verificar meu telefone para vincular à minha conta${emailPart}`;
  }, [usuario]);

  // Generate token on demand when user clicks the button instead of automatically on load
  async function generateToken() {
    setGenerating(true);
    setError(null);
    try {
      const res = await api.post('/verificacao', { usuarioId: usuario?.id ?? null });
      const json = res.data;
      if (json && json.token) setToken(json.token);
      else setError('Resposta inválida do servidor');
    } catch (err: unknown) {
      console.warn('Could not create verification token', err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Erro ao criar token');
    } finally {
      setGenerating(false);
    }
  }

  const encoded = encodeURIComponent(`${defaultMessage} TOKEN:${token ?? ''}`);
  const waLink = `https://wa.me/${companyNumber}?text=${encoded}`;

  function handleOpen() {
    // open in new tab and navigate back to returnTo in current tab
    try {
      window.open(waLink, '_blank');
    } catch (e) {
      // ignore
    }
    // mark that we should check phone status after returning from WhatsApp
    try { if (typeof window !== 'undefined') localStorage.setItem('check_phone_after_whatsapp', '1'); } catch {}
    // wait 3 seconds to give the user time to switch to WhatsApp and send the message
    setTimeout(() => {
      // If the caller explicitly requested returning to Minha Conta, respect it.
      // Otherwise prefer sending the user to the cadastro flow page so they continue signup.
      if (returnTo === '/minha-conta') router.push(returnTo);
      else router.push('/cadastro/telefone');
    }, 3000);
  }


  return (
    <div className={styles.container}>
      <div className={styles.logoContainer}>
        <Image src="/Logo-floricultura.svg" alt="Floricultura" width={400} height={120} />
      </div>
      <h1 className={styles.heading}>Cadastrar telefone via WhatsApp</h1>

      <p>Para vincular seu número de telefone envie a mensagem pré-definida para o número da empresa usando o link abaixo:</p>
      <div style={{justifyContent: 'flex-start', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8}}>
          <label>Mensagem:</label>
          <textarea className={styles.textarea} value={defaultMessage} readOnly rows={5} />
        </div>
      </div>

          <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={async () => {
                if (!token) await generateToken();
                else handleOpen();
              }}
              disabled={generating}
            >
              {generating ? 'Gerando link...' : token ? 'Abrir no WhatsApp' : 'Gerar link'}
            </button>
            <button type="button" className={styles.secondaryBtn} onClick={() => router.push('/')}>Voltar</button>
          </div>

      <div style={{ marginTop: 12 }}>
        <small>Ao clicar em &quot;Abrir no WhatsApp&quot; você será levado para o WhatsApp para enviar a mensagem para {companyNumber}.</small>
        {error && <div style={{ color: 'red', marginTop: 8 }}>Erro: {error}</div>}
      </div>
    </div>
  );
}
