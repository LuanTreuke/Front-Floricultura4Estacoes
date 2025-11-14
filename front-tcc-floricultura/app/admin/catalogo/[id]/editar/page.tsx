"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

import { fetchProductById, Product } from '@/services/productService';
import api from '@/services/api';

export default function EditarProdutoPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);
  const [produto, setProduto] = useState<Product | null>(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [categoria, setCategoria] = useState('');
  const [categories, setCategories] = useState<Array<{ id: number; nome: string }>>([]);
  const [, setImagem] = useState<File | null>(null);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    fetchProductById(id).then((prod: Product | null) => {
      if (prod) {
        setProduto(prod);
        setNome(prod.nome);
        setDescricao(prod.descricao || '');
        setPreco(prod.preco.toString());
        // produto pode trazer relation 'categoria' ou só Categoria_id
        const catId = prod.categoria ? prod.categoria.id : prod.Categoria_id;
        setCategoria(catId ? String(catId) : '');
        setEnabled(prod.enabled === undefined ? true : !!prod.enabled);
      }
    });
    // buscar categorias do backend
    (async () => {
      try {
        const res = await api.get('/categorias');
        setCategories(res.data || []);
      } catch {
        setCategories([]);
      }
    })();
  }, [id]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setImagem(e.target.files[0]);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    (async () => {
      try {
        const payload: Partial<Product> = {
          nome,
          descricao,
          preco: Number(preco),
          Categoria_id: categoria ? Number(categoria) : undefined,
          enabled,
        };
        // TODO: upload imagem se houver
        const { updateProduct } = await import('@/services/productService');
        const res = await updateProduct(id, payload);
        if (res) {
          alert('Produto salvo com sucesso');
          router.push('/admin/catalogo');
        } else {
          alert('Falha ao salvar produto');
        }
      } catch (err) {
        console.error(err);
        alert('Erro ao salvar produto');
      }
    })();
  }

  if (!produto) return <div>Carregando...</div>;

  return (
  <div style={{maxWidth: 800, margin: '0 auto', color: '#222'}}>
      <h1 style={{fontSize: '2rem', fontWeight: 600, marginBottom: 24}}>Editar produto</h1>
      <form onSubmit={handleSubmit} style={{background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.08)', padding: 32, display: 'flex', flexDirection: 'column', gap: 24}}>
        <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
          <label style={{fontWeight: 500}}>Imagens do produto</label>
          <input type="file" accept="image/*" onChange={handleImageChange} style={{marginBottom: 8}} />
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
          <label>Nome do produto</label>
          <input value={nome} onChange={e => setNome(e.target.value)} required style={{padding: 10, borderRadius: 8, border: '1px solid #cbead6'}} />
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
          <label>Descrição</label>
          <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={3} style={{padding: 10, borderRadius: 8, border: '1px solid #cbead6'}} />
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
          <label>Preço (R$)</label>
          <input type="number" value={preco} onChange={e => setPreco(e.target.value)} required style={{padding: 10, borderRadius: 8, border: '1px solid #cbead6'}} />
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
          <label>Categoria</label>
          <select value={categoria} onChange={e => setCategoria(e.target.value)} required style={{padding: 10, borderRadius: 8, border: '1px solid #cbead6'}}>
            <option value="">Selecione a categoria</option>
            {categories.map(c => (
              <option key={c.id} value={String(c.id)}>{c.nome}</option>
            ))}
          </select>
        </div>
        <div style={{display: 'flex', gap: 16, justifyContent: 'flex-end'}}>
        <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
          <input id="enabled" type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
          <label htmlFor="enabled"> Exibir produto na loja (Ativo)</label>
        </div>
          <button type="button" onClick={() => router.push('/admin/catalogo')} style={{background: '#f3f7f4', color: '#222', border: 'none', borderRadius: 8, padding: '12px 24px', fontWeight: 500, fontSize: '1rem', cursor: 'pointer'}}>Cancelar</button>
          <button type="submit" style={{background: '#cbead6', color: '#222', border: 'none', borderRadius: 8, padding: '12px 24px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer'}}>Salvar</button>
        </div>
      </form>
    </div>
  );
}
