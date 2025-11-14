"use client";
import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from '../styles/ProductDetail.module.css';
import { fetchProductById, Product } from '../services/productService';
import { getCurrentUser, User } from '../services/authService';
import { addToCart } from '../services/cartService';
import { buildImageURL } from '../utils/imageUtils';

type Props = {
  productId: number;
  onClose?: () => void;
  inline?: boolean;
};

export default function ProductPopup({ productId, onClose, inline = false }: Props) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [addedMsg, setAddedMsg] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const p = await fetchProductById(productId);
        setProduct(p);
      } finally {
        setLoading(false);
      }
    })();
    try {
      const u: User = getCurrentUser();
      setIsLoggedIn(!!u && typeof u.id === 'number');
    } catch {}
  }, [productId]);

  useEffect(() => {
    if (inline) return;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const prev = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
    };
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (onClose) onClose();
      }
    }

    function preventScroll(e: Event) { e.preventDefault(); }

    window.addEventListener('keydown', onKey);
    const overlayEl = overlayRef.current;
    if (overlayEl) {
      overlayEl.addEventListener('wheel', preventScroll, { passive: false });
      overlayEl.addEventListener('touchmove', preventScroll, { passive: false });
    }

    return () => {
      window.removeEventListener('keydown', onKey);
      if (overlayEl) {
        overlayEl.removeEventListener('wheel', preventScroll);
        overlayEl.removeEventListener('touchmove', preventScroll);
      }
      document.body.style.overflow = prev.overflow;
      document.body.style.position = prev.position;
      document.body.style.top = prev.top;
      document.body.style.left = prev.left;
      document.body.style.right = prev.right;
      window.scrollTo(0, scrollY);
    };
  }, [inline, onClose]);

  const content = (
    <div className={styles.container} role="dialog" aria-label="Produto">
      {loading ? (
        <div>Carregando...</div>
      ) : !product ? (
        <div>Produto não encontrado</div>
      ) : (
        <div className={styles.layout}>
          {product.imagem_url ? (
            <Image src={buildImageURL(product.imagem_url)} alt={product.nome} className={styles.image} width={400} height={400} style={{ objectFit: 'cover' }} />
          ) : (
            <div className={styles.image}>Img</div>
          )}
          <div className={styles.info}>
            <h1 className={styles.title}>{product.nome}</h1>
            <p className={styles.price}>R${Number(product.preco).toFixed(2)}</p>
            <p className={styles.description}>{product.descricao}</p>

            {isLoggedIn ? (
              <>
                <div className={styles.actions}>
                  <button className={styles.orderBtn} onClick={() => {
                    if (onClose) onClose();
                    router.push(`/product/${productId}/pedido`);
                  }}>Fazer pedido</button>
                </div>

                <div className={styles.actions}>
                  <button className={styles.shoppingCart} onClick={() => {
                    addToCart({ id: product.id, nome: product.nome, preco: product.preco, imagem_url: product.imagem_url });
                    setAddedMsg('Adicionado');
                    setTimeout(() => setAddedMsg(null), 1500);
                  }}>
                    <span className={'material-icons'}>shopping_cart</span>
                    {addedMsg || 'Adicionar ao carrinho'}
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.loginNotice}>
                <p>Faça login para realizar o pedido ou adicionar ao carrinho.</p>
                <button className={styles.loginNoticeBtn} onClick={() => router.push('/login')}>Ir para login</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (inline) return content;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 30000 }}>
      <div
        ref={overlayRef}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 30000 }}
        onClick={() => { if (onClose) onClose(); }}
      />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(900px, 95vw)',
          maxHeight: '85vh',
          overflowY: 'auto',
          background: 'white',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          zIndex: 30001,
        }}
      >
        <button
          aria-label="Fechar"
          onClick={() => { if (onClose) onClose(); }}
          style={{
            position: 'sticky',
            top: 0,
            marginLeft: 'auto',
            display: 'block',
            background: 'transparent',
            border: 'none',
            padding: 12,
            cursor: 'pointer',
            zIndex: 1,
          }}
        >
          <span className="material-icons" style={{ fontSize: 22 }}>close</span>
        </button>
        {content}
      </div>
    </div>
  );
}


