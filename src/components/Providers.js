'use client';

import { AuthProvider, CartProvider, ProductProvider } from '@/context';

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <ProductProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </ProductProvider>
    </AuthProvider>
  );
}
