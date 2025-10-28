"use client";
import React, { useEffect, useState } from 'react';
import styles from '../../styles/MyAccount.module.css';
import { getCurrentUser, User } from '../../services/authService';
import { fetchPhones, PhoneDto, createPhone, updatePhone, deletePhone } from '../../services/phoneService';
import { fetchAddresses, AddressDto, createAddress, updateAddress, deleteAddress } from '../../services/addressService';
import { useRouter } from 'next/navigation';

export default function MyAccountPage() {
  const router = useRouter();
  const [phones, setPhones] = useState<PhoneDto[]>([]);
  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [editingPhone, setEditingPhone] = useState<number | null>(null);
  const [editingAddress, setEditingAddress] = useState<number | null>(null);
  const [phoneValue, setPhoneValue] = useState('');
  const [addressValue, setAddressValue] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddressRua, setNewAddressRua] = useState('');

  useEffect(() => {
    const usuario = getCurrentUser();
    if (!usuario || typeof usuario.id !== 'number') {
      router.push('/login');
      return;
    }
    (async () => {
      const ph = await fetchPhones();
      setPhones((ph || []).filter(p => p.Usuario_id === usuario.id));
      const ad = await fetchAddresses();
      setAddresses((ad || []).filter(a => a.Usuario_id === usuario.id));
    })();
  }, [router]);

  async function handleSavePhone(id: number) {
    await updatePhone(id, { telefone: phoneValue });
    setPhones(phones.map(p => p.id === id ? { ...p, telefone: phoneValue } : p));
    setEditingPhone(null);
  }

  async function handleDeletePhone(id: number) {
    if (!confirm('Remover telefone?')) return;
    await deletePhone(id);
    setPhones(phones.filter(p => p.id !== id));
  }

  async function handleAddPhone() {
    const usuario = getCurrentUser();
    if (!newPhone || !usuario || typeof usuario.id !== 'number') return;
    const created = await createPhone({ telefone: newPhone, Usuario_id: usuario.id });
    setPhones([...(phones || []), created]);
    setNewPhone('');
  }

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

  async function handleAddAddress() {
    const usuario = getCurrentUser();
    if (!newAddressRua || !usuario || typeof usuario.id !== 'number') return;
    const created = await createAddress({ rua: newAddressRua, numero: '', bairro: '', cep: '', cidade: '', Usuario_id: usuario.id });
    setAddresses([...(addresses || []), created]);
    setNewAddressRua('');
  }

  const usuario: User = getCurrentUser();

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
        <h2>Telefones</h2>
        <div className={styles.list}>
          {phones.map(p => (
            <div key={p.id} className={styles.item}>
              {editingPhone === p.id ? (
                <input className={styles.input} value={phoneValue} onChange={e => setPhoneValue(e.target.value)} />
              ) : (
                <div className={styles.value}>{p.telefone}</div>
              )}
              <div className={styles.actions}>
                {editingPhone === p.id ? (
                  <>
                    <button className={styles.saveBtn} onClick={() => handleSavePhone(p.id!)}>Salvar</button>
                    <button className={styles.cancelBtn} onClick={() => setEditingPhone(null)}>Cancelar</button>
                  </>
                ) : (
                  <>
                    <button className={styles.editBtn} onClick={() => { setEditingPhone(p.id!); setPhoneValue(p.telefone); }} aria-label="Editar telefone">✎</button>
                    <button className={styles.deleteBtn} onClick={() => handleDeletePhone(p.id!)} aria-label="Excluir telefone">✖</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.addRow}>
          <input className={styles.input} placeholder="Novo telefone" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
          <button className={styles.addBtn} onClick={handleAddPhone}>Adicionar</button>
        </div>
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
                    <button className={styles.deleteBtn} onClick={() => handleDeleteAddress(a.id!)} aria-label="Excluir endereço">✖</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.addRow}>
          <input className={styles.input} placeholder="Rua do novo endereço" value={newAddressRua} onChange={e => setNewAddressRua(e.target.value)} />
          <button className={styles.addBtn} onClick={handleAddAddress}>Adicionar endereço</button>
        </div>
      </section>
    </div>
  );
}
