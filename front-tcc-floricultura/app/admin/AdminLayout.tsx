import React from 'react';
import Link from 'next/link';
import styles from '../../styles/AdminLayout.module.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.adminContainer}>
      <nav className={styles.adminNav}>
        <div className={styles.adminNavTitle}>Painel administrativo</div>
        <ul className={styles.adminNavList}>
          <li className={styles.adminNavItem}>
            <Link href="/admin/pedidos" className={styles.adminNavBtn}>
              Gerenciar pedidos
            </Link>
          </li>
          <li className={styles.adminNavItem}>
            <Link href="/admin/catalogo" className={styles.adminNavBtn}>
              Gerenciar catálogo
            </Link>
          </li>
          <li className={styles.adminNavItem}>
            <Link href="#" className={styles.adminNavBtn}>
              Gerenciar categorias
            </Link>
          </li>
          <li className={styles.adminNavItem}>
            <Link href="#" className={styles.adminNavBtn}>
              Gerar relatórios
            </Link>
          </li>
        </ul>
      </nav>
      <main className={styles.adminMain}>{children}</main>
    </div>
  );
}
