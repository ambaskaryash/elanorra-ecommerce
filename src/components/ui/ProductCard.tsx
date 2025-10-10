'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { HeartIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { ApiProduct } from '@/lib/services/api';
import { formatPrice, getDiscountPercentage } from '@/lib/utils';
import { useCartStore } from '@/lib/store/cart-store';
import { useWishlistStore } from '@/lib/store/wishlist-store';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: ApiProduct;
  className?: string;
}

export default function ProductCard({ product, className = '' }: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const { addItem } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const isWishlisted = isInWishlist(product.id);

  const discount = product.compareAtPrice 
    ? getDiscountPercentage(product.compareAtPrice, product.price)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation when clicking the button
    addItem(product);
    toast.success(`${product.name} added to cart!`);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleWishlist(product);
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`group relative bg-white hover:shadow-xl transition-all duration-300 overflow-hidden ${className}`}
    >
      <Link href={`/products/${product.slug}`} className="block">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden bg-stone-100">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}
          
          <Image
            src={product.images[0]?.src || '/images/placeholder.jpg'}
            alt={product.images[0]?.alt || product.name}
            fill
            className={`object-cover transition-all duration-500 group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            onLoad={() => setImageLoaded(true)}
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col space-y-1">
            {new Date(product.createdAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000 && (
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                New
              </span>
            )}
            {product.reviewCount > 10 && product.avgRating > 4.5 && (
              <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                Bestseller
              </span>
            )}
            {discount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                {discount}% Off
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={handleToggleWishlist}
            className="absolute top-3 right-3 p-2.5 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full transition-all opacity-0 group-hover:opacity-100 duration-300 shadow-sm hover:shadow-md"
          >
            {isWishlisted ? (
              <HeartSolidIcon className="h-5 w-5 text-red-500" />
            ) : (
              <HeartIcon className="h-5 w-5 text-gray-700" />
            )}
          </button>

          {/* Quick Add to Cart */}
          <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className={`w-full flex items-center justify-center space-x-2 py-3 px-4 text-sm font-light transition-all duration-300 ${
                product.inStock
                  ? 'bg-gray-900 hover:bg-gray-800 text-white shadow-lg'
                  : 'bg-gray-400 text-gray-600 cursor-not-allowed'
              }`}
            >
              <ShoppingBagIcon className="h-4 w-4" />
              <span className="uppercase tracking-wider">{product.inStock ? 'Add to Cart' : 'Out of Stock'}</span>
            </motion.button>
          </div>

          {/* Out of Stock Overlay */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-white text-gray-900 px-4 py-2 text-sm font-light uppercase tracking-wider">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-5">
          {/* Category */}
          {product.category && (
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-light">
              {product.category}
            </p>
          )}

          {/* Product Name */}
          <h3 className="text-base font-light text-gray-900 mb-3 line-clamp-2 group-hover:text-gray-600 transition-colors leading-snug tracking-wide">
            {product.name}
          </h3>

          {/* Short Description */}
          <p className="text-sm text-gray-500 mb-4 line-clamp-2 font-light leading-relaxed">
            {product.description.length > 90 
              ? product.description.substring(0, 90) + '...' 
              : product.description
            }
          </p>

          {/* Price */}
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-xl font-light text-gray-900 tracking-wide">
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-sm text-gray-400 line-through font-light">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>

          {/* Stock Status & Rating */}
          <div className="flex items-center justify-between">
            {product.inStock && product.inventory < 10 && (
              <p className="text-xs text-amber-600 font-light">
                Only {product.inventory} left
              </p>
            )}
            {product.reviewCount > 0 && (
              <div className="flex items-center space-x-1">
                <span className="text-xs text-gray-400">★</span>
                <span className="text-xs text-gray-500 font-light">
                  {product.avgRating} ({product.reviewCount})
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}