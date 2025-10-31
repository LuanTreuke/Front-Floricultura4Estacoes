"use client";
import React, { useEffect, useState } from 'react';
import { getCurrentUser } from '../../services/authService';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Offcanvas } from 'react-bootstrap';
import styles from '../../styles/AdminLayout.module.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      // runtime check: only allow users with role 'Admin' (or legacy 'cargo') to view admin pages
      const u = getCurrentUser();
      if (!u || !(u.role === 'Admin' || u.cargo === 'Admin')) {
        router.push('/');
      }
    } catch {
      router.push('/');
    }
  }, [router]);

  return (
    <div className={styles.adminContainer}>
      {/* Toggle button for Offcanvas */}
      {/* Hamburger toggle (hidden while Offcanvas is open) */}
      {!show && (
        <div style={{ position: 'fixed', top: 12, left: 12, zIndex: 1100 }}>
          <button
            className={styles.hamburgerBtn}
            aria-label="Abrir painel"
            onClick={() => setShow(true)}
            type="button"
          >
            {/* simple 3-bar icon */}
            <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect y="0" width="20" height="2" rx="1" fill="currentColor" />
              <rect y="6" width="20" height="2" rx="1" fill="currentColor" />
              <rect y="12" width="20" height="2" rx="1" fill="currentColor" />
            </svg>
          </button>
        </div>
      )}

      <Offcanvas show={show} onHide={() => setShow(false)} placement="start">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Painel administrativo</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <ul className={styles.adminNavList}>
            <li className={styles.adminNavItem}>
              <Link href="/admin/pedidos" className={styles.adminNavBtn} onClick={() => setShow(false)}>
                Gerenciar pedidos
              </Link>
            </li>
            <li className={styles.adminNavItem}>
              <Link href="/admin/catalogo" className={styles.adminNavBtn} onClick={() => setShow(false)}>
                Gerenciar catálogo
              </Link>
            </li>
            <li className={styles.adminNavItem}>
              <Link href="/admin/categorias" className={styles.adminNavBtn} onClick={() => setShow(false)}>
                Gerenciar categorias
              </Link>
            </li>
            <li className={styles.adminNavItem}>
              <Link href="/admin/relatorios" className={styles.adminNavBtn} onClick={() => setShow(false)}>
                Gerar relatórios
              </Link>
            </li>
          </ul>
        </Offcanvas.Body>
      </Offcanvas>

      <main className={styles.adminMain}>{children}</main>
    </div>
  );
}
