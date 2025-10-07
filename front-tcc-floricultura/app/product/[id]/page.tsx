"use client";
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchProductById, Product } from '../../../services/productService';
import styles from '../../../styles/ProductDetail.module.css';
import { addToCart } from '../../../services/cartService';

export default function ProductPage() {
  const params = useParams();
  const id = Number(params?.id);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [addedMsg, setAddedMsg] = useState<string | null>(null);
  
  useEffect(() => {
    fetchProductById(id).then(p => { setProduct(p); setLoading(false); });
  }, [id]);

  if (loading) return <div>Carregando...</div>;
  if (!product) return <div>Produto não encontrado</div>;

  return (
    <div className={styles.container}>
      <div className={styles.layout}>
        <img src={product.imagem_url || ''} alt={product.nome} className={styles.image} />
        <div className={styles.info}>
          <h1 className={styles.title}>{product.nome}</h1>
          <p className={styles.price}>R${Number(product.preco).toFixed(2)}</p>
          <p className={styles.description}>{product.descricao}</p>

          <div className={styles.actions}>
            <button className={styles.orderBtn} onClick={() => router.push(`/product/${id}/pedido`)}>Fazer pedido</button>
          </div>

          <div className={styles.actions}>
            <button className={styles.shoppingCart} onClick={() => {
              addToCart({ id: product.id, nome: product.nome, preco: product.preco, imagem_url: product.imagem_url });
              setAddedMsg('Adicionado');
              setTimeout(() => setAddedMsg(null), 1500);
            }}>
              <span className={`material-icons ${styles.icon}`}>shopping_cart</span>
              {addedMsg || 'Adicionar ao carrinho'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
