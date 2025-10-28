"use client";
import React from 'react';
import CartPopup from '../../components/CartPopup';

export default function CartPage() {
  // reuse the popup inline variant so direct navigation still works
  return <CartPopup inline={true} />;
}
