"use client";

import Link from "next/link";
import Image from "next/image";
import { FaStar, FaHeart, FaShoppingCart, FaTag } from "react-icons/fa";
import { useCart } from "@/context/CartContext";

export default function ProductCard({ product, onAddToCart, onAddToWishlist }) {
  const cart = useCart();
  const handleAddToCart = onAddToCart || cart?.addToCart;
  const handleAddToWishlist = onAddToWishlist || cart?.addToWishlist;
  const {
    id,
    name,
    price,
    originalPrice,
    images,
    averageRating = 0,
    reviewCount = 0,
    isNegotiable = false,
  } = product;

  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const defaultImage = "/file.svg";

  return (
    <div className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full">
      {/* Image */}
      <Link href={`/products/${id}`} className="block">
        <div className="relative aspect-[4/3] sm:aspect-[4/3] bg-gray-100 overflow-hidden">
          <Image
            src={images?.[0] || defaultImage}
            alt={name}
            fill
            sizes="(max-width: 480px) 100vw, (max-width: 640px) 50vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Discount Badge */}
          {discount > 0 && (
            <div className="absolute top-1.5 left-1.5 xs:top-2 xs:left-2 bg-red-500 text-white text-xs font-bold px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-lg">
              -{discount}%
            </div>
          )}

          {/* Negotiable Badge */}
          {isNegotiable && (
            <div className="absolute top-1.5 right-1.5 xs:top-2 xs:right-2 bg-green-500 text-white text-xs font-bold px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-lg flex items-center gap-0.5 xs:gap-1">
              <FaTag size={8} className="xs:w-2.5 xs:h-2.5" />
              <span className="hidden xs:inline">Negotiable</span>
            </div>
          )}

          {/* Quick Actions */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 xs:p-3 sm:p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <div className="flex justify-center gap-1.5 xs:gap-2 sm:gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleAddToCart?.(id);
                }}
                className="p-1 xs:p-1.5 sm:p-2 bg-white rounded-full hover:bg-blue-600 hover:text-white transition-colors touch-manipulation"
                aria-label="Add to cart"
              >
                <FaShoppingCart className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleAddToWishlist?.(id);
                }}
                className="p-1 xs:p-1.5 sm:p-2 bg-white rounded-full hover:bg-red-500 hover:text-white transition-colors touch-manipulation"
                aria-label="Add to wishlist"
              >
                <FaHeart className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </Link>

      {/* Content */}
      <Link href={`/products/${id}`} className="flex-1 flex flex-col">
        <div className="p-2 xs:p-2.5 sm:p-3 flex-1 flex flex-col">
          {/* Rating */}
          <div className="flex items-center gap-0.5 xs:gap-1 mb-1.5 xs:mb-2">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => {
                const filled = i < Math.round(averageRating);
                return (
                  <FaStar
                    key={i}
                    size={8}
                    fill={filled ? "#fbbf24" : "none"}
                    className={`${filled ? "" : "text-gray-300"} w-3 h-3 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5`}
                  />
                );
              })}
            </div>
            <span className="text-[10px] xs:text-xs text-gray-500">
              ({reviewCount})
            </span>
          </div>

          {/* Name */}
          <h3 className="font-medium text-gray-900 mb-1.5 xs:mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors text-xs xs:text-sm sm:text-base">
            {name}
          </h3>

          {/* Price */}
          <div className="flex items-baseline gap-1 xs:gap-1 sm:gap-1.5 mt-auto">
            <span className="text-xs xs:text-sm sm:text-base font-bold text-gray-900">
              {price?.toFixed(2)} Tk.
            </span>
            {originalPrice && (
              <span className="text-[10px] xs:text-xs sm:text-sm text-gray-400 line-through">
                {originalPrice?.toFixed(2)} Tk.
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
