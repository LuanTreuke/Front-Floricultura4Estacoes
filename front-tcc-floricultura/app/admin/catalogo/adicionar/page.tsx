"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addProduct, Product } from '@/services/productService';
import { fetchCategories, Categoria } from '@/services/categoryService';

export default function AdicionarProdutoPage() {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [categoria, setCategoria] = useState('');
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [imagem, setImagem] = useState<File | null>(null);
  const [enabled, setEnabled] = useState(true);
  const router = useRouter();

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setImagem(e.target.files[0]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const dto = {
        nome,
        descricao,
        preco: Number(preco),
        imagem_url: imagem ? '' : '',
        Categoria_id: Number(categoria || 0),
          enabled,
      };
      await addProduct(dto as Omit<Product, 'id'>);
      alert('Produto adicionado com sucesso!');
      router.push('/admin/catalogo');
    } catch {
      alert('Erro ao adicionar produto!');
    }
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const cats = await fetchCategories();
        if (!mounted) return;
        setCategories(cats);
      } catch (e) {
        // keep empty categories on error
        console.warn('Failed to load categories', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
  <div style={{maxWidth: 800, margin: '0 auto', color: '#222'}}>
      <h1 style={{fontSize: '2rem', fontWeight: 600, marginBottom: 24}}>Adicione um produto</h1>
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
            {categories.length > 0 ? categories.map(c => (
              <option key={c.id} value={String(c.id)}>{c.nome}</option>
            )) : (
              <>
                <option value="1">Buquês</option>
                <option value="2">Arranjos</option>
                <option value="3">Flores</option>
                <option value="4">Cestas</option>
              </>
            )}
          </select>
        </div>
        <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
          <input id="enabled" type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
          <label htmlFor="enabled"> Exibir produto na loja (Ativo)</label>
        </div>
        <div style={{display: 'flex', gap: 16, justifyContent: 'flex-end'}}>
          <button type="button" onClick={() => router.push('/admin/catalogo')} style={{background: '#f3f7f4', color: '#222', border: 'none', borderRadius: 8, padding: '12px 24px', fontWeight: 500, fontSize: '1rem', cursor: 'pointer'}}>Cancelar</button>
          <button type="submit" style={{background: '#cbead6', color: '#222', border: 'none', borderRadius: 8, padding: '12px 24px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer'}}>Adicionar</button>
        </div>
      </form>
    </div>
  );
}
