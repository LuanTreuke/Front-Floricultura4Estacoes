"use client";
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchProductById, Product } from '../../../services/productService';
import styles from '../../../styles/ProductDetail.module.css';

export default function ProductPage() {
  const params = useParams();
  const id = Number(params?.id);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  
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
        </div>
      </div>
    </div>
  );
}
