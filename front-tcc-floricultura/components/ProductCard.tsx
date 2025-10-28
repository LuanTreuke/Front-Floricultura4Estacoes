import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from '../styles/ProductCard.module.css';

interface ProductCardProps {
  id?: number;
  name: string;
  price: string;
  image: string;
}
export default function ProductCard({ id, name, price, image }: ProductCardProps) {
  const isExternal = image.startsWith('http://') || image.startsWith('https://');
  const imgSrc = isExternal ? image : image.startsWith('/') ? image : `/${image}`;
  const content = (
    <div className={styles.card}>
      {imgSrc ? (
        <Image src={imgSrc} alt={name} className={styles.image} width={300} height={300} style={{ objectFit: 'cover' }} />
      ) : (
        <div className={styles.image}>Img</div>
      )}
      <div className={styles.info}>
        <span className={styles.name}>{name}</span>
        <span className={styles.price}>{price}</span>
      </div>
    </div>
  );

  if (id) {
    return (
      <Link href={`/product/${id}`} aria-label={`Ver ${name}`} className={styles.link}>
        {content}
      </Link>
    );
  }
  return content;
}
