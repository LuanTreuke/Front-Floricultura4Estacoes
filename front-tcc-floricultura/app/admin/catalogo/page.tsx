"use client";
import React, { useEffect, useState } from 'react';
import adminStyles from '../../../styles/AdminLayout.module.css';
import homeStyles from '../../../styles/HomePage.module.css';
import { useRouter } from 'next/navigation';
import ProductCard from '../../../components/ProductCard';
import SearchBar from '../../../components/SearchBar';
import CategoryFilter from '../../../components/CategoryFilter';
import PriceRange from '../../../components/PriceRange';
import SortButtons from '../../../components/SortButtons';
import axios from 'axios';
import { fetchProducts, Product, deleteProduct, updateProduct } from '../../../services/productService';

export default function AdminCatalogoPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState<[number, number]>([0, 300]);
  const [sort, setSort] = useState('new');
  const [products, setProducts] = useState<Product[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<string, number>>({});
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    fetchProducts()
      .then(data => {
        if (!mounted) return;
        setProducts(data);
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setError('Erro ao carregar produtos');
        setLoading(false);
      });

    (async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await axios.get(`${API_URL}/categorias`);
        const cats = res.data as Array<{ id: number; nome: string }>;
        if (!mounted) return;
        setCategories(['Todas', ...cats.map(c => c.nome)]);
        const map: Record<string, number> = {};
        cats.forEach(c => (map[c.nome] = c.id));
        setCategoryMap(map);
      } catch {
        if (!mounted) return;
        const fallback = ['Buquês', 'Arranjos', 'Flores', 'Cestas'];
        setCategories(['Todas', ...fallback]);
        setCategoryMap({ 'Buquês': 1, 'Arranjos': 2, 'Flores': 3, 'Cestas': 4 });
      }
    })();

    return () => { mounted = false; };
  }, []);

  function removeAccents(str: string) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function handleEdit(id: number) {
    router.push(`/admin/catalogo/${id}/editar`);
  }
  function handleDelete(id: number) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      // chama o backend para excluir
      deleteProduct(id).then(success => {
        if (success) {
          setProducts(products.filter(p => p.id !== id));
        } else {
          alert('Falha ao excluir o produto no servidor.');
        }
      }).catch(() => {
        alert('Erro de rede ao tentar excluir o produto.');
      });
    }
  }

  async function toggleEnabled(id: number, value: boolean) {
    // optimistic update
    setProducts(prev => prev.map(p => p.id === id ? { ...p, enabled: value } : p));
    try {
      const res = await updateProduct(id, { enabled: value });
      if (!res) {
        // rollback
        setProducts(prev => prev.map(p => p.id === id ? { ...p, enabled: !value } : p));
        alert('Falha ao atualizar o produto no servidor.');
      }
    } catch (e) {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, enabled: !value } : p));
      alert('Erro de rede ao atualizar o produto.');
    }
  }

  async function setAllEnabled(value: boolean) {
    // confirm before disabling all
    if (value === false) {
      const ok = confirm('Tem certeza que deseja desabilitar todos os produtos?');
      if (!ok) return;
    }

    const snapshot = products.slice();
    const prevMap = new Map<number, boolean>();
    snapshot.forEach(p => prevMap.set(p.id, p.enabled === undefined ? true : !!p.enabled));

    setBulkLoading(true);
    // optimistic
    setProducts(prev => prev.map(p => ({ ...p, enabled: value })));

    try {
      const promises = snapshot.map(p =>
        updateProduct(p.id, { enabled: value }).then(res => ({ id: p.id, ok: !!res })).catch(() => ({ id: p.id, ok: false }))
      );
      const results = await Promise.all(promises);
      const failed = results.filter(r => !r.ok).map(r => r.id);
      if (failed.length > 0) {
        // rollback failed ones
        setProducts(prev => prev.map(p => failed.includes(p.id) ? { ...p, enabled: prevMap.get(p.id) as boolean } : p));
        alert(`Falha ao atualizar ${failed.length} produto(s).`);
      } else {
        // success
        // small feedback
        // (could use toast) — using alert for simplicity
        alert('Operação concluída com sucesso.');
      }
    } catch (e) {
      // rollback everything
      setProducts(snapshot);
      alert('Erro de rede ao atualizar os produtos.');
    } finally {
      setBulkLoading(false);
    }
  }

  return (
    <div className={adminStyles.adminMain} style={{ padding: 0 }}>
      <div className={homeStyles.container} style={{ padding: 15, boxSizing: 'border-box' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{fontSize: '2rem', fontWeight: 600}}>Gerenciar Catálogo</h1>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button
                className={adminStyles.headerControlBtn}
                style={{background: '#e9f7ff', color: '#0b3a57'}}
                onClick={() => setAllEnabled(true)}
                disabled={bulkLoading}
              >
                <i className="bi bi-toggle-on" aria-hidden></i> Habilitar todos
              </button>
              <button
                className={adminStyles.headerControlBtn}
                style={{background: '#fff4f4', color: '#5a1b1b'}}
                onClick={() => setAllEnabled(false)}
                disabled={bulkLoading}
              >
                <i className="bi bi-toggle-off" aria-hidden></i> Desabilitar todos
              </button>
            </div>

            <div>
              <button
                className={adminStyles.headerControlBtn}
                style={{background: '#cbead6', color: '#222'}}
                onClick={() => router.push('/admin/catalogo/adicionar')}
                disabled={bulkLoading}
              >
                 <i className="bi bi-plus-circle" aria-hidden></i> Adicionar produto
              </button>
            </div>
          </div>
        </div>

        <div className={homeStyles.searchBar}>
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar produtos" />
        </div>

        <div className={homeStyles.filters}>
          {categories.length > 0 ? (
            <CategoryFilter categories={categories} selected={category} onSelect={setCategory} />
          ) : (
            <div style={{ padding: '8px 12px', color: '#666' }}>Carregando categorias...</div>
          )}
          <PriceRange min={0} max={300} value={price} onChange={setPrice} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <SortButtons selected={sort} onSelect={setSort} />
        </div>

        <div className={homeStyles.productsGrid}>
          {loading && <span>Carregando produtos...</span>}
          {error && <span style={{ color: 'red' }}>{error}</span>}
          {!loading && !error && products
            .filter((p) => {
              const nomeNormalized = removeAccents(p.nome || '').toLowerCase();
              const searchNormalized = removeAccents(search || '').toLowerCase();
              const categoryMatch = ((category === '' || category === 'Todas') ? true : (p.categoria ? p.categoria.id === categoryMap[category] : p.Categoria_id === categoryMap[category]));
              return nomeNormalized.includes(searchNormalized) && categoryMatch && p.preco >= price[0] && p.preco <= price[1];
            })
            .sort((a, b) => {
              if (sort === 'new') return b.id - a.id;
              if (sort === 'asc') return a.preco - b.preco;
              if (sort === 'desc') return b.preco - a.preco;
              return 0;
            })
            .map((p) => (
              <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                <ProductCard
                  id={p.id}
                  name={p.nome}
                  price={`R$${Number(p.preco).toFixed(2)}`}
                  image={p.imagem_url || ''}
                  topRight={
                    <label style={{ display: 'flex', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        checked={p.enabled === undefined ? true : !!p.enabled}
                        onClick={(e) => { e.stopPropagation(); }}
                        onChange={e => toggleEnabled(p.id, e.target.checked)}
                        aria-label={p.enabled === undefined || p.enabled ? 'Marcar como inativo' : 'Marcar como ativo'}
                      />
                    </label>
                  }
                />
                <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
                  <button
                    className={adminStyles.adminActionBtn}
                    onClick={() => handleEdit(p.id)}
                  >
                    Editar
                  </button>
                  <button
                    className={adminStyles.adminActionBtnDanger}
                    onClick={() => handleDelete(p.id)}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
