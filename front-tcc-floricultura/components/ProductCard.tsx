import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from '../styles/ProductCard.module.css';

interface ProductCardProps {
  id?: number;
  name: string;
  price: string;
  image: string;
  topRight?: React.ReactNode;
  onClick?: () => void;
}

export default function ProductCard({ id, name, price, image, topRight, onClick }: ProductCardProps) {
  const isExternal = image.startsWith('http://') || image.startsWith('https://');
  const imgSrc = isExternal ? image : image.startsWith('/') ? image : `/${image}`;

  const inner = (
    <div className={styles.card}>
      {imgSrc ? (
        <Image src={imgSrc} alt={name} className={styles.image} width={300} height={300} style={{ objectFit: 'cover' }} />
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
      {id ? (
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
