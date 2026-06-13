'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FaStar, FaHeart, FaShoppingCart, FaTag } from 'react-icons/fa';

export default function ProductCard({ product, onAddToCart, onAddToWishlist }) {
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

  const defaultImage = '/file.svg';

  return (
    <div className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Image */}
      <Link href={`/products/${id}`}>
        <div className="relative h-48 bg-gray-100 overflow-hidden">
          <Image
            src={images?.[0] || defaultImage}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Discount Badge */}
          {discount > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
              -{discount}%
            </div>
          )}
          
          {/* Negotiable Badge */}
          {isNegotiable && (
            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
              <FaTag size={10} />
              Negotiable
            </div>
          )}
          
          {/* Quick Actions */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <div className="flex justify-center gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onAddToCart?.(id);
                }}
                className="p-2 bg-white rounded-full hover:bg-blue-600 hover:text-white transition-colors"
              >
                <FaShoppingCart />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onAddToWishlist?.(id);
                }}
                className="p-2 bg-white rounded-full hover:bg-red-500 hover:text-white transition-colors"
              >
                <FaHeart />
              </button>
            </div>
          </div>
        </div>
      </Link>

      {/* Content */}
      <Link href={`/products/${id}`}>
        <div className="p-4">
          {/* Rating */}
          <div className="flex items-center gap-1 mb-2">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <FaStar
                  key={i}
                  size={12}
                  fill={i < Math.round(averageRating) ? '#fbbf24' : 'none'}
                  className={i < Math.round(averageRating) ? '' : 'text-gray-300'}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">({reviewCount} reviews)</span>
          </div>

          {/* Name */}
          <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {name}
          </h3>

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-gray-900">
              ${price?.toFixed(2)}
            </span>
            {originalPrice && (
              <span className="text-sm text-gray-400 line-through">
                ${originalPrice?.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
