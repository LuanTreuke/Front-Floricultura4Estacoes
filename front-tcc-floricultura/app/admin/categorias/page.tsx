"use client";
import React, { useEffect, useState } from 'react';
import styles from '../../../styles/AdminLayout.module.css';
import { fetchCategories, createCategory, updateCategory, deleteCategory, Categoria } from '../../../services/categoryService';

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const cats = await fetchCategories();
        if (mounted) setCategorias(cats || []);
      } catch (err) {
        console.warn('Falha ao carregar categorias', err);
        if (mounted) setCategorias([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  async function handleAdd() {
    if (!newName.trim()) return alert('Informe o nome da categoria');
    try {
      const created = await createCategory(newName.trim());
      setCategorias((s) => [created, ...s]);
      setNewName('');
    } catch (err) {
      console.error('Erro ao criar categoria', err);
      alert('Falha ao criar categoria');
    }
  }

  async function handleEdit(cat: Categoria) {
    const novo = window.prompt('Novo nome da categoria:', cat.nome);
    if (!novo) return;
    try {
      const updated = await updateCategory(cat.id, novo);
      setCategorias((s) => s.map(c => (c.id === cat.id ? (updated || { ...cat, nome: novo }) : c)));
    } catch (err) {
      console.error('Erro ao editar categoria', err);
      alert('Falha ao editar categoria');
    }
  }

  async function handleDelete(cat: Categoria) {
    const ok = window.confirm(`Confirma exclusão da categoria "${cat.nome}"?`);
    if (!ok) return;
    try {
      const success = await deleteCategory(cat.id);
      if (success) setCategorias((s) => s.filter(c => c.id !== cat.id));
      else alert('Falha ao excluir categoria');
    } catch (err) {
      console.error('Erro ao excluir categoria', err);
      alert('Falha ao excluir categoria');
    }
  }


  return (
    <div className={styles.adminMain}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h1 style={{ fontSize: '1.25rem', margin: 0 }}>Gerenciar categorias</h1>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Nova categoria"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{ flex: 1, padding: 14, fontSize: 16, borderRadius: 8, border: '1px solid #e6e6e6', background: '#fff' }}
          />
          <button
            className={styles.adminNavBtn}
            onClick={handleAdd}
            style={{ padding: '8px 12px', width: 'auto', display: 'inline-flex', borderRadius: 8 }}
          >Adicionar</button>
        </div>

        {loading ? (
          <div>Carregando categorias...</div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, background: '#fff', border: '1px solid #ececec', borderRadius: 8 }}>
            {categorias.map((cat) => (
              <li key={cat.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #f5f5f5' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontWeight: 600, color: '#222' }}>{cat.nome}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    className={styles.adminNavBtn}
                    onClick={() => handleEdit(cat)}
                    style={{ padding: '8px 12px', width: 'auto', display: 'inline-flex', borderRadius: 8, background: '#f4f6f7', borderColor: '#e6e6e6', color: '#222' }}
                  >Editar</button>
                  <button
                    className={styles.adminNavBtn}
                    onClick={() => handleDelete(cat)}
                    style={{ background: '#e86b6b', borderColor: '#e86b6b', color: '#fff', padding: '8px 12px', width: 'auto', display: 'inline-flex', borderRadius: 8 }}
                  >Excluir</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
