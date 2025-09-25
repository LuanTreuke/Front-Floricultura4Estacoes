"use client";
import React, { useEffect, useState } from 'react';
import styles from '../../../styles/HomePage.module.css';
import { useRouter } from 'next/navigation';
import ProductCard from '../../../components/ProductCard';
import { fetchProducts, Product, deleteProduct } from '../../../services/productService';

export default function AdminCatalogoPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchProducts()
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Erro ao carregar produtos');
        setLoading(false);
      });
  }, []);

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

  return (
  <div style={{ color: '#222' }}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}>
        <h1 style={{fontSize: '2rem', fontWeight: 600}}>Catálogo de Produtos</h1>
        <button
          style={{background: '#cbead6', color: '#222', border: 'none', borderRadius: 8, padding: '12px 24px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer'}}
          onClick={() => router.push('/admin/catalogo/adicionar')}
        >
          + Adicionar produto
        </button>
      </div>
      <div className={styles.productsGrid}>
        {loading && <span>Carregando produtos...</span>}
        {error && <span style={{ color: 'red' }}>{error}</span>}
        {!loading && !error && products.map((p) => (
          <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ProductCard
              name={p.nome}
              price={`R$${Number(p.preco).toFixed(2)}`}
              image={p.imagem_url || '/bouquet1.jpg'}
            />
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <button
                style={{background: '#cbead6', color: '#222', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 500, fontSize: '0.98rem', cursor: 'pointer'}}
                onClick={() => handleEdit(p.id)}
              >
                Editar
              </button>
              <button
                style={{background: '#f7d6d6', color: '#c0392b', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 500, fontSize: '0.98rem', cursor: 'pointer'}}
                onClick={() => handleDelete(p.id)}
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
