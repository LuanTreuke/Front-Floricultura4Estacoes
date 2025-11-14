import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from '../styles/ProductCard.module.css';
import { buildImageURL } from '@/utils/imageUtils';

interface ProductCardProps {
  id?: number;
  name: string;
  price: string;
  image: string;
  topRight?: React.ReactNode;
  onClick?: () => void;
  noLink?: boolean;
}

export default function ProductCard({ id, name, price, image, topRight, onClick, noLink }: ProductCardProps) {
  const imgSrc = buildImageURL(image);
  const isNgrok = imgSrc.includes('ngrok-free.app');

  const inner = (
    <div className={styles.card} style={noLink ? { cursor: 'default' } : {}}>
      {imgSrc ? (
        isNgrok ? (
          // Para ngrok, usar img comum em vez de Next/Image para evitar problemas de otimização
          <img 
            src={imgSrc} 
            alt={name} 
            className={styles.image} 
            style={{ 
              width: '300px', 
              height: '300px', 
              objectFit: 'cover',
              display: 'block'
            }}
            onError={(e) => {
              if (process.env.NODE_ENV === 'development') {
                console.warn('Imagem não pôde ser carregada:', imgSrc);
              }
              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik0xNTAgMjAwQzE3Ny42MTQgMjAwIDIwMCAxNzcuNjE0IDIwMCAxNTBDMjAwIDEyMi4zODYgMTc3LjYxNCAxMDAgMTUwIDEwMEMxMjIuMzg2IDEwMCAxMDAgMTIyLjM4NiAxMDAgMTUwQzEwMCAxNzcuNjE0IDEyMi4zODYgMjAwIDE1MCAyMDBaIiBzdHJva2U9IiM5Y2EzYWYiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K';
            }}
          />
        ) : (
          <Image src={imgSrc} alt={name} className={styles.image} width={300} height={300} style={{ objectFit: 'cover' }} />
        )
      ) : (
        <div className={styles.image}>Img</div>
      )}

      {/* render topRight inside the card so it overlays the image area */}
      {topRight && <div className={styles.topRight}>{topRight}</div>}

      <div className={styles.info}>
        <span className={styles.name}>{name}</span>
        <span className={styles.price}>{price}</span>
      </div>
    </div>
  );

  return (
    <div className={styles.cardWrapper}>
      {noLink ? (
        <div className={styles.noLinkCard}>{inner}</div>
      ) : id ? (
        onClick ? (
          <button type="button" onClick={onClick} aria-label={`Ver ${name}`} className={styles.link} style={{ background: 'transparent', border: 'none', padding: 0 }}>
            {inner}
          </button>
        ) : (
          <Link href={`/product/${id}`} aria-label={`Ver ${name}`} className={styles.link}>
            {inner}
          </Link>
        )
      ) : (
        inner
      )}
    </div>
  );
}
