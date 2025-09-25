"use client"
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../styles/HomePage.module.css';
import SearchBar from '../components/SearchBar';
import CategoryFilter from '../components/CategoryFilter';
import PriceRange from '../components/PriceRange';
import SortButtons from '../components/SortButtons';
import ProductCard from '../components/ProductCard';



import { fetchProducts, Product } from '../services/productService';
import axios from 'axios';

// categorias serão carregadas do backend

export default function HomePage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState<[number, number]>([0, 300]);
  const [sort, setSort] = useState('new');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
  const [orderBtnBottom, setOrderBtnBottom] = useState(32);
  const orderBtnRef = useRef<HTMLButtonElement>(null);
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const { getCurrentUser } = require('../services/authService');
      const usuario = getCurrentUser();
      setIsLoggedIn(!!usuario);
    }
  }, []);

  // Ajusta o bottom do botão para não sobrepor o footer
  useEffect(() => {
    function handleScroll() {
      if (!orderBtnRef.current || !footerRef.current) return;
      const footerRect = footerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      // Se o footer está visível na tela
      if (footerRect.top < windowHeight - 15) {
        const overlap = windowHeight - footerRect.top + 15;
        setOrderBtnBottom(overlap > 32 ? overlap : 32);
      } else {
        setOrderBtnBottom(32);
      }
    }
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Fecha o popup ao clicar fora
  useEffect(() => {
    if (!showPopup) return;
    function handleClick(e: MouseEvent) {
      const popup = document.getElementById('login-popup');
      if (popup && !popup.contains(e.target as Node)) {
        setShowPopup(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showPopup]);


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

    // buscar categorias do backend
    (async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await axios.get(`${API_URL}/categorias`);
        const cats = res.data as Array<{ id: number; nome: string }>;
        // prepend 'Todas' option
        setCategories(['Todas', ...cats.map(c => c.nome)]);
        const map: Record<string, number> = {};
        cats.forEach(c => (map[c.nome] = c.id));
        setCategoryMap(map);
      } catch (e) {
        // fallback estático
        const fallback = ['Buquês', 'Arranjos', 'Flores', 'Cestas'];
        setCategories(['Todas', ...fallback]);
        setCategoryMap({ 'Buquês': 1, 'Arranjos': 2, 'Flores': 3, 'Cestas': 4 });
      }
    })();
  }, []);



  const [categories, setCategories] = useState<string[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<string, number>>({});

  function removeAccents(str: string) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  let filtered = products.filter((p: Product) => {
    const nomeNormalized = removeAccents(p.nome.toLowerCase());
    const searchNormalized = removeAccents(search.toLowerCase());
    return (
      nomeNormalized.includes(searchNormalized) &&
  ((category === '' || category === 'Todas') ? true : (p.categoria ? p.categoria.id === categoryMap[category] : p.Categoria_id === categoryMap[category])) &&
      p.preco >= price[0] && p.preco <= price[1]
    );
  });
  if (sort === 'new') filtered = filtered.sort((a: Product, b: Product) => b.id - a.id);
  if (sort === 'asc') filtered = filtered.sort((a: Product, b: Product) => a.preco - b.preco);
  if (sort === 'desc') filtered = filtered.sort((a: Product, b: Product) => b.preco - a.preco);

  const router = useRouter();
  return (
    <div>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.logo}>
            <img src="/Logo floricultura.jpg" alt="Logo Floricultura Quatro Estações" style={{ height: 96, width: 'auto', display: 'block' }} />
          </div>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
              className={styles.loginBtn}
              onClick={() => {
                if (isLoggedIn) setShowPopup((v) => !v);
                else router.push('/login');
              }}
            >
              {isLoggedIn ? (
                <span className="material-icons" style={{ verticalAlign: 'middle', fontSize: 22, marginRight: 0 }}>account_circle</span>
              ) : null}
              {isLoggedIn ? '' : 'Login'}
            </button>
            {isLoggedIn && showPopup && (
              <div id="login-popup" className={styles.loginPopup}>
                <button
                  className={styles.loginPopupBtn}
                  onClick={() => setShowPopup(false)}
                >
                  Minha conta
                </button>
                <button
                  className={styles.loginPopupBtn}
                  onClick={() => {
                    setShowPopup(false);
                    router.push('/admin');
                  }}
                >
                  Painel administrativo
                </button>
                <button
                  className={styles.loginPopupBtn}
                  onClick={() => {
                    // desloga: remove o usuário armazenado e atualiza a interface
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    const { logout } = require('../services/authService');
                    logout();
                    setIsLoggedIn(false);
                    setShowPopup(false);
                    router.push('/');
                  }}
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </header>

        <div className={styles.searchBar}>
          <SearchBar value={search} onChange={setSearch} placeholder="Encontre seu produto" />
        </div>

        <div className={styles.filters}>
          {categories.length > 0 ? (
            <CategoryFilter categories={categories} selected={category} onSelect={setCategory} />
          ) : (
            <div style={{ padding: '8px 12px', color: '#666' }}>Carregando categorias...</div>
          )}
          <PriceRange min={0} max={300} value={price} onChange={setPrice} />
        </div>

        <div className={styles.sectionTitle}>Nossos produtos</div>
        <SortButtons selected={sort} onSelect={setSort} />


        <div className={styles.productsGrid}>
          {loading && <span>Carregando produtos...</span>}
          {error && <span style={{ color: 'red' }}>{error}</span>}
          {!loading && !error && filtered.map((p) => (
            <ProductCard
              key={p.id}
              id={p.id}
              name={p.nome}
              price={`R$${Number(p.preco).toFixed(2)}`}
              image={p.imagem_url || ''}
            />
          ))}
        </div>

        <button
          className={styles.orderBtn}
          ref={orderBtnRef}
          style={{ bottom: orderBtnBottom, position: 'fixed', left: '50%', transform: 'translateX(-50%)' }}
          onClick={() => router.push('/product')}
        >
          <span role="img" aria-label="whatsapp"></span> Faça seu pedido!
        </button>
      </div>

      <footer className={styles.footerSection} ref={footerRef}>
        <div className={styles.footerContent}>
          <div className={styles.footerCol}>
            <span className={styles.footerTitle}>Email</span>
            <span>email</span>
          </div>
          <div className={styles.footerCol}>
            <span className={styles.footerTitle}>Redes Sociais</span>
            <span>redes sociais</span>
          </div>
          <div className={styles.footerCol}>
            <span className={styles.footerTitle}>Termos</span>
            <span>termos</span>
          </div>
        </div>
        <div className={styles.footerAddress}>
          Avenida Paula Freitas 1006 – Nossa senhora da Salete
        </div>
      </footer>
    </div>
  );
}
