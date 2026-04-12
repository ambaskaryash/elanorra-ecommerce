'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, cubicBezier } from 'framer-motion';
import { HeartIcon, ShoppingBagIcon, SquaresPlusIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { ApiProduct } from '@/lib/services/api';
import { formatPrice, getDiscountPercentage } from '@/lib/utils';
import { useCartStore } from '@/lib/store/cart-store';
import { useWishlistStore } from '@/lib/store/wishlist-store';
import { useCompareStore } from '@/lib/store/compare-store';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: ApiProduct;
  className?: string;
  variant?: 'default' | 'homepage';
}

export default function ProductCard({ product, className = '', variant = 'default' }: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const { addItem } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { toggle: toggleCompare, isCompared } = useCompareStore();
  const isWishlisted = isInWishlist(product.id);
  const inCompare = isCompared(product.id);

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

  const handleToggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleCompare(product);
    toast.success(inCompare ? 'Removed from compare' : 'Added to compare');
  };

  return (
    <motion.div
      whileHover={{ y: variant === 'homepage' ? -6 : -4, scale: variant === 'homepage' ? 1.01 : 1 }}
      transition={{ duration: 0.35, ease: cubicBezier(0.16, 1, 0.3, 1) }}
      className={`group relative rounded-2xl p-[1px] transition-all duration-300 ${className}`}
    >
      {/* Decorative minimalist border that appears on hover */}
      <div
        className="absolute inset-0 border border-transparent group-hover:border-gray-200 transition-colors duration-300 pointer-events-none"
      />

      <div className="relative bg-white border border-gray-100 group-hover:border-gray-200 overflow-hidden transition-all duration-300">
        <Link href={`/products/${product.slug}`} className="block">
          {/* Product Image */}
          <div className="relative aspect-square overflow-hidden bg-stone-50">
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
            )}
          
          <Image
            src={imgError ? '/images/placeholder.svg' : (product.images[0]?.src || '/images/placeholder.svg')}
            alt={product.images[0]?.alt || product.name}
            fill
            className={`object-cover transition-all duration-500 group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImgError(true);
              setImageLoaded(true);
            }}
          />

          {/* Subtle gradient overlay on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.0) 60%, rgba(0,0,0,0.12) 100%)'
          }} />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col space-y-2 uppercase tracking-widest z-10 text-[9px]">
            {new Date(product.createdAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000 && (
              <span className="bg-white border border-gray-900 text-gray-900 px-2 py-1 font-medium shadow-sm w-fit">
                New
              </span>
            )}
            {product.reviewCount > 10 && product.avgRating > 4.5 && (
              <span className="bg-white border border-gray-900 text-gray-900 px-2 py-1 font-medium shadow-sm w-fit">
                Bestseller
              </span>
            )}
            {discount > 0 && (
              <span className="bg-gray-900 text-white px-2 py-1 font-medium shadow-sm w-fit">
                {discount}% Off
              </span>
            )}
          </div>

          {/* Wishlist & Compare Buttons */}
          <button
            onClick={handleToggleWishlist}
            className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm hover:bg-gray-900 hover:text-white rounded-none transition-all opacity-0 group-hover:opacity-100 duration-300 border border-gray-200 group/btn"
          >
            {isWishlisted ? (
              <HeartSolidIcon className="h-4 w-4 text-gray-900 group-hover/btn:text-white transition-colors" />
            ) : (
              <HeartIcon className="h-4 w-4 text-gray-900 group-hover/btn:text-white transition-colors" />
            )}
          </button>

          <button
            onClick={handleToggleCompare}
            className="absolute top-12 right-3 p-2 bg-white/90 backdrop-blur-sm hover:bg-gray-900 hover:text-white rounded-none transition-all opacity-0 group-hover:opacity-100 duration-300 border border-gray-200"
            aria-label={inCompare ? 'Remove from compare' : 'Add to compare'}
          >
            <SquaresPlusIcon className={`h-4 w-4 ${inCompare ? 'text-gray-900 shrink-0' : 'text-gray-900'}`} />
          </button>

          {/* Quick Add to Cart */}
          <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 text-center">
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className={`w-full inline-flex items-center justify-center space-x-2 py-3 px-4 text-[10px] font-medium tracking-widest transition-all duration-300 rounded-none uppercase ${
                product.inStock
                  ? 'bg-gray-900 hover:bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
              }`}
            >
              <span className="uppercase tracking-widest">{product.inStock ? 'Add to Cart' : 'Out of Stock'}</span>
            </button>
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
          {!imageLoaded ? (
            <div>
              <div className="h-3 w-24 bg-gray-200 rounded mb-3 animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-200 rounded mb-2 animate-pulse" />
              <div className="h-4 w-2/3 bg-gray-200 rounded mb-4 animate-pulse" />
              <div className="h-5 w-32 bg-gray-200 rounded mb-2 animate-pulse" />
            </div>
          ) : (
            <>
              {/* Category */}
              {product.category && (
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">
                  {product.category}
                </p>
              )}

              {/* Product Name */}
              <h3 className="text-sm font-serif text-gray-900 mb-2 line-clamp-2 group-hover:text-gray-600 transition-colors uppercase tracking-widest">
                {product.name}
              </h3>

              {/* Short Description */}
              <p className="text-[11px] text-gray-500 mb-4 line-clamp-2 uppercase tracking-widest">
                {product.description.length > 70 
                  ? product.description.substring(0, 70) + '...' 
                  : product.description}
              </p>

              {/* Price */}
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-sm font-medium text-gray-900 tracking-wide">
                  {formatPrice(product.price)}
                </span>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <span className="text-xs text-gray-400 line-through">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                )}
              </div>

              {/* Stock Status & Rating */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-3">
                {product.inStock && product.inventory < 10 && (
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                    Only {product.inventory} left
                  </p>
                )}
                {product.reviewCount > 0 && (
                  <div className="flex items-center space-x-1 uppercase tracking-widest">
                    <span className="text-[10px] text-gray-400">★</span>
                    <span className="text-[10px] text-gray-500">
                      {product.avgRating} ({product.reviewCount})
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </Link>
      </div>
    </motion.div>
  );
}