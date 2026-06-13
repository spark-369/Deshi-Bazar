import { api } from './api';

export const cartService = {
  // Get user's cart
  async getCart() {
    const data = await api.get('/api/cart');
    return data;
  },

  // Add item to cart
  async addToCart(productId, quantity = 1) {
    const data = await api.post('/api/cart', { productId, quantity });
    return data;
  },

  // Update cart item quantity
  async updateCartItem(itemId, quantity) {
    const data = await api.put('/api/cart', { itemId, quantity });
    return data;
  },

  // Remove item from cart
  async removeFromCart(itemId) {
    const data = await api.delete(`/api/cart?itemId=${itemId}`);
    return data;
  },

  // Clear entire cart
  async clearCart() {
    const data = await api.delete('/api/cart?clearAll=true');
    return data;
  },

  // Get user's wishlist
  async getWishlist() {
    const data = await api.get('/api/cart?type=wishlist');
    return data;
  },

  // Add item to wishlist
  async addToWishlist(productId) {
    const data = await api.post('/api/cart', { productId, type: 'wishlist' });
    return data;
  },

  // Remove item from wishlist
  async removeFromWishlist(productId) {
    const data = await api.delete(`/api/cart?productId=${productId}&type=wishlist`);
    return data;
  },
};

export default cartService;
