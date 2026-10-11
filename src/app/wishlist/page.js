'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { Card, Button } from '@/components/common';
import ProductCard from '@/components/product/ProductCard';
import { FaHeart, FaTrash, FaShoppingCart } from 'react-icons/fa';

export default function WishlistPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { wishlist, removeFromWishlist, addToCart, refreshWishlist } = useCart();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshWishlist();
      setLoading(false);
    }
  }, [isAuthenticated]);

  const handleRemoveFromWishlist = async (productId) => {
    if (!confirm('Remove this item from wishlist?')) return;
    
    try {
      await removeFromWishlist(productId);
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product.id, 1);
      await removeFromWishlist(product.id);
      alert('Added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Wishlist</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Products you've saved for later</p>
        </div>

        {wishlist.length === 0 ? (
          <Card className="p-8 sm:p-12 text-center">
            <FaHeart className="text-4xl sm:text-5xl text-gray-300 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">Your wishlist is empty</h3>
            <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8 max-w-md mx-auto px-4">Save items you love to your wishlist</p>
            <Link href="/products">
              <Button className="w-full sm:w-auto">Browse Products</Button>
            </Link>
          </Card>
        ) : (
          <>
            <div className="mb-4 text-sm sm:text-base text-gray-600">
              {wishlist.length} item{wishlist.length !== 1 ? 's' : ''} in your wishlist
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {wishlist.map((item) => (
                <Card key={item.id} className="p-3 sm:p-4">
                  <Link href={`/products/${item.product?.id}`}>
                    <div className="aspect-square bg-gray-100 rounded-lg mb-3 sm:mb-4 overflow-hidden">
                      {item.product?.images && item.product.images.length > 0 ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs sm:text-sm">
                          No Image
                        </div>
                      )}
                    </div>
                  </Link>
                  
                  <Link href={`/products/${item.product?.id}`}>
                    <h3 className="font-medium text-gray-900 hover:text-blue-600 line-clamp-2 mb-1 text-sm sm:text-base">
                      {item.product?.name}
                    </h3>
                  </Link>
                  
                  <p className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3">
                     Tk.{item.product?.price?.toFixed(2)}
                  </p>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleAddToCart(item.product)}
                    >
                      <FaShoppingCart className="mr-1" />
                      <span className="hidden xs:inline">Add to Cart</span>
                      <span className="xs:hidden">Add</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveFromWishlist(item.product?.id)}
                    >
                      <FaTrash />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
