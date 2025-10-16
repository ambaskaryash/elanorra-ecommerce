'use client';

import { useAuth } from '@/lib/contexts/auth-context';
import { useCartStore } from '@/lib/store/cart-store';
import { useWishlistStore } from '@/lib/store/wishlist-store';
import { formatPrice } from '@/lib/utils';
import {
  HeartIcon,
  ShareIcon,
  ShoppingBagIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { motion, type Variants, cubicBezier } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import type { Product } from '@/types';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: cubicBezier(0.12, 0, 0.39, 1),
    },
  },
};

function isProductWithFlags(p: unknown): p is Product {
  return typeof p === 'object' && p !== null && ('newArrival' in p || 'bestseller' in p);
}

export default function WishlistPage() {
  const { items: wishlistItems, removeFromWishlist, clearWishlist } = useWishlistStore();
  const { addItem } = useCartStore();
  const { isAuthenticated, isLoading } = useAuth();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isClearing, setIsClearing] = useState(false);

  // Check if user is admin (using NextAuth session)
  const isAdmin = session?.user?.isAdmin === true;

  // Redirect to login if not authenticated and not admin
  useEffect(() => {
    // Only redirect if we're sure the user is not authenticated and not an admin
    // (i.e., loading is complete and user is still not authenticated and not admin)
    if (!isLoading && status !== 'loading' && !isAuthenticated && !isAdmin) {
      router.push('/auth/login?redirect=/account/wishlist');
    }
  }, [isAuthenticated, isLoading, isAdmin, status, router]);

  // Show loading state
  if (isLoading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  // Don't render if not authenticated and not admin (will redirect)
  if (!isAuthenticated && !isAdmin) {
    return null;
  }

  const handleAddToCart = (product: any) => {
    addItem(product);
    toast.success(`${product.name} added to cart!`);
  };

  const handleRemoveFromWishlist = (productId: string, productName: string) => {
    removeFromWishlist(productId);
    toast.success(`${productName} removed from wishlist`);
  };

  const handleClearWishlist = async () => {
    setIsClearing(true);
    
    // Add a small delay for better UX
    setTimeout(() => {
      clearWishlist();
      setIsClearing(false);
      toast.success('Wishlist cleared');
    }, 500);
  };

  const handleShare = async (product: any) => {
    if (typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}/products/${product.slug}`;
      const nav = window.navigator as Navigator & {
        share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
        clipboard?: Clipboard;
      };
      if (typeof nav.share === 'function') {
        try {
          await nav.share({
            title: product.name,
            text: `Check out this amazing product: ${product.name}`,
            url: shareUrl,
          });
          return;
        } catch {
          // ignore share errors
        }
      }
      if (nav.clipboard && typeof nav.clipboard.writeText === 'function') {
        try {
          await nav.clipboard.writeText(shareUrl);
          toast.success('Product link copied to clipboard!');
          return;
        } catch {
          // ignore clipboard errors
        }
      }
    }
    toast.success('Sharing not supported in this environment.');
  };

  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
            <p className="text-gray-600">Save your favorite products for later</p>
          </div>
        </div>

        {/* Empty State */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <HeartIcon className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Discover amazing products and save your favorites by clicking the heart icon on any product.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center px-6 py-3 bg-rose-600 text-white font-medium rounded-md hover:bg-rose-700 transition-colors"
            >
              <ShoppingBagIcon className="h-5 w-5 mr-2" />
              Start Shopping
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
              <p className="text-gray-600">
                {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
              </p>
            </div>
            
            {wishlistItems.length > 0 && (
              <div className="flex space-x-3">
                <Link
                  href="/shop"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Continue Shopping
                </Link>
                <button
                  onClick={handleClearWishlist}
                  disabled={isClearing}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                >
                  {isClearing ? 'Clearing...' : 'Clear All'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Wishlist Items */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {wishlistItems.map((product) => (
            <motion.div
              key={product.id}
              variants={itemVariants}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden group"
            >
              <div className="relative">
                <Link href={`/products/${product.slug}`}>
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    <Image
                      src={product.images[0]?.src || '/images/placeholder.jpg'}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col space-y-1">
                      {isProductWithFlags(product) && product.newArrival && (
                        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                          New
                        </span>
                      )}
                      {isProductWithFlags(product) && product.bestseller && (
                        <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                          Bestseller
                        </span>
                      )}
                      {product.compareAtPrice && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                          Sale
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Action Buttons */}
                <div className="absolute top-3 right-3 flex flex-col space-y-2">
                  <button
                    onClick={() => handleRemoveFromWishlist(product.id, product.name)}
                    className="p-2 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full transition-colors shadow-sm"
                  >
                    <XMarkIcon className="h-4 w-4 text-gray-700" />
                  </button>
                  
                  <button
                    onClick={() => handleShare(product)}
                    className="p-2 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full transition-colors shadow-sm opacity-0 group-hover:opacity-100 duration-300"
                  >
                    <ShareIcon className="h-4 w-4 text-gray-700" />
                  </button>
                </div>

                {/* Out of Stock Overlay */}
                {!product.inStock && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="bg-white/90 text-gray-900 px-3 py-1 rounded-full text-sm font-medium">
                      Out of Stock
                    </span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <Link href={`/products/${product.slug}`}>
                  <h3 className="font-medium text-gray-900 mb-1 line-clamp-2 hover:text-rose-600 transition-colors">
                    {product.name}
                  </h3>
                </Link>

                {/* Price */}
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-lg font-bold text-gray-900">
                    {formatPrice(product.price)}
                  </span>
                  {product.compareAtPrice && product.compareAtPrice > product.price && (
                    <span className="text-sm text-gray-500 line-through">
                      {formatPrice(product.compareAtPrice)}
                    </span>
                  )}
                </div>

                {/* Stock Status */}
                {product.inStock && product.inventory < 10 && (
                  <p className="text-xs text-orange-600 mb-3">
                    Only {product.inventory} left in stock
                  </p>
                )}

                {/* Add to Cart Button */}
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={!product.inStock}
                  className={`w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    product.inStock
                      ? 'bg-rose-600 text-white hover:bg-rose-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <ShoppingBagIcon className="h-4 w-4" />
                  <span>{product.inStock ? 'Add to Cart' : 'Out of Stock'}</span>
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Back to Top */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="text-center">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-rose-600 hover:text-rose-700 font-medium"
          >
            Back to Top
          </button>
        </div>
      </div>
    </div>
  );
}