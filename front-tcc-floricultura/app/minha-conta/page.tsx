"use client";
import React, { useEffect, useState } from 'react';
import styles from '../../styles/MyAccount.module.css';
import { getCurrentUser, User } from '../../services/authService';
import { fetchPhones, PhoneDto, deletePhone } from '../../services/phoneService';
import { fetchAddresses, AddressDto, updateAddress, deleteAddress } from '../../services/addressService';
import { useRouter } from 'next/navigation';

export default function MyAccountPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<User | null>(null);
  const [phones, setPhones] = useState<PhoneDto[]>([]);
  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [editingAddress, setEditingAddress] = useState<number | null>(null);
  
  const [addressValue, setAddressValue] = useState('');
  // removed newPhone input per single-phone UX
  // navigation to add-address page now used instead of inline input

  useEffect(() => {
    const usuarioLocal = getCurrentUser();
    if (!usuarioLocal || typeof usuarioLocal.id !== 'number') {
      router.push('/login');
      return;
    }
    setUsuario(usuarioLocal);
    (async () => {
      const ph = await fetchPhones();
      setPhones(ph || []);
  const ad = await fetchAddresses();
  setAddresses((ad || []).filter(a => a.Usuario_id === usuarioLocal.id));
    })();
  }, [router]);

  async function handleDeletePhone() {
    if (!confirm('Remover telefone?')) return;
    await deletePhone(0);
    setPhones([]);
    try {
      if (typeof window !== 'undefined') {
        const cur = getCurrentUser();
        if (cur) {
          (cur as any).telefone = null;
          localStorage.setItem('usuario', JSON.stringify(cur));
        }
      }
    } catch (err) {
      console.warn('Failed to update localStorage usuario telefone', err);
    }
  }

  // add-phone removed: use Edit to change telefone

  async function handleSaveAddress(id: number) {
    await updateAddress(id, { rua: addressValue });
    setAddresses(addresses.map(a => a.id === id ? { ...a, rua: addressValue } : a));
    setEditingAddress(null);
  }

  async function handleDeleteAddress(id: number) {
    if (!confirm('Remover endereço?')) return;
    await deleteAddress(id);
    setAddresses(addresses.filter(a => a.id !== id));
  }

  // handleAddAddress removed; use dedicated cadastro/endereco page which can redirect back using ?returnTo=

  // usuario is client-loaded via useEffect to avoid SSR/CSR hydration mismatch

  return (
    <div className={styles.container}>
      <h1>Minha conta</h1>

      <section className={styles.section}>
        <h2>Email cadastrado</h2>
        <div className={styles.row}>
          <div className={styles.value}>{usuario?.email || '—'}</div>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Telefone</h2>
        <div className={styles.list}>
          <div className={styles.item}>
            <div className={styles.value}>{phones[0]?.telefone || '—'}</div>

            <div className={styles.actions}>
              {phones[0]?.telefone ? (
                <>
                  <button className={styles.deleteBtn} onClick={() => handleDeletePhone()} aria-label="Excluir telefone">X</button>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* when there is no phone, show the add button below the info like addresses */}
        {!phones[0]?.telefone && (
          <div className={styles.addRow}>
            <button className={styles.addBtn} onClick={() => router.push('/cadastro/telefone/novo?returnTo=/minha-conta')}>Adicionar telefone</button>
          </div>
        )}
        {/* removed add-row: only edit/delete allowed for telefone */}
      </section>

      <section className={styles.section}>
        <h2>Endereços</h2>
        <div className={styles.list}>
          {addresses.map(a => (
            <div key={a.id} className={styles.item}>
              {editingAddress === a.id ? (
                <input className={styles.input} value={addressValue} onChange={e => setAddressValue(e.target.value)} />
              ) : (
                <div className={styles.value}>{`${a.rua}, ${a.numero} - ${a.bairro}`}</div>
              )}
              <div className={styles.actions}>
                {editingAddress === a.id ? (
                  <>
                    <button className={styles.saveBtn} onClick={() => handleSaveAddress(a.id!)}>Salvar</button>
                    <button className={styles.cancelBtn} onClick={() => setEditingAddress(null)}>Cancelar</button>
                  </>
                ) : (
                  <>
                    <button className={styles.editBtn} onClick={() => { setEditingAddress(a.id!); setAddressValue(a.rua); }} aria-label="Editar endereço">✎</button>
                    <button className={styles.deleteBtn} onClick={() => handleDeleteAddress(a.id!)} aria-label="Excluir endereço">X</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.addRow}>
          <button className={styles.addBtn} onClick={() => router.push('/cadastro/endereco?returnTo=/minha-conta')}>Adicionar endereço</button>
        </div>
      </section>
    </div>
  );
}
