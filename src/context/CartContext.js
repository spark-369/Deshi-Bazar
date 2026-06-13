'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartService } from '@/services';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [itemCount, setItemCount] = useState(0);
  const { isAuthenticated } = useAuth();

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      setItemCount(0);
      return;
    }

    try {
      setLoading(true);
      const cartData = await cartService.getCart();
      setCart(cartData);
      setItemCount(cartData.items?.length || 0);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlist([]);
      return;
    }

    try {
      const wishlistData = await cartService.getWishlist();
      setWishlist(wishlistData || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
    fetchWishlist();
  }, [fetchCart, fetchWishlist]);

  const addToCart = async (productId, quantity = 1) => {
    try {
      setLoading(true);
      await cartService.addToCart(productId, quantity);
      await fetchCart();
      return { success: true };
    } catch (error) {
      console.error('Error adding to cart:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      setLoading(true);
      await cartService.updateCartItem(itemId, quantity);
      await fetchCart();
      return { success: true };
    } catch (error) {
      console.error('Error updating quantity:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      setLoading(true);
      await cartService.removeFromCart(itemId);
      await fetchCart();
      return { success: true };
    } catch (error) {
      console.error('Error removing from cart:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      await cartService.clearCart();
      setCart(null);
      setItemCount(0);
      return { success: true };
    } catch (error) {
      console.error('Error clearing cart:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (productId) => {
    try {
      setLoading(true);
      await cartService.addToWishlist(productId);
      await fetchWishlist();
      return { success: true };
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      setLoading(true);
      await cartService.removeFromWishlist(productId);
      await fetchWishlist();
      return { success: true };
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    cart,
    wishlist,
    loading,
    itemCount,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    addToWishlist,
    removeFromWishlist,
    refreshCart: fetchCart,
    refreshWishlist: fetchWishlist,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext;
