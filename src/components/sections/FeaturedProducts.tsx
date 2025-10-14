'use client';

import { useState, useEffect } from 'react';
import { motion, Variants, cubicBezier } from 'framer-motion';
import Link from 'next/link';
import ProductCard from '@/components/ui/ProductCard';
import { ApiProduct } from '@/lib/services/api';

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
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: cubicBezier(0.16, 1, 0.3, 1),
    },
  },
};

export default function FeaturedProducts() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/products?limit=8&sortBy=createdAt&sortOrder=desc');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        setProducts(data.products || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-b from-white to-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl heading-xl mb-6 tracking-wide">Featured Products</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto font-light leading-relaxed">
              Handpicked favorites that showcase the best of our craftsmanship and design.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 lg:gap-10">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-300 mb-4"></div>
                <div className="h-4 bg-gray-300 mb-2"></div>
                <div className="h-3 bg-gray-300 mb-3"></div>
                <div className="h-4 bg-gray-300 w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-gradient-to-b from-white to-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl heading-xl mb-6">Featured Products</h2>
            <p className="text-red-600">Error loading products: {error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-b from-white to-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
        >
          {/* Section Header */}
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl heading-xl mb-6 tracking-wide">Featured Products</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto font-light leading-relaxed">
              Handpicked favorites that showcase the best of our craftsmanship and design. 
              Each piece is created with love and attention to detail.
            </p>
          </motion.div>

          {/* Products Grid */}
          <motion.div 
            variants={containerVariants}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 lg:gap-10"
          >
            {products.map((product) => (
              <motion.div key={product.id} variants={itemVariants}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>

          {/* View All Products Link */}
          <motion.div variants={itemVariants} className="text-center mt-16">
            <Link
              href="/shop"
              className="inline-flex items-center px-8 py-4 bg-transparent border border-rose-600 text-rose-700 font-light hover:bg-rose-600 hover:text-white transition-all duration-300 tracking-wider uppercase text-sm rounded-lg"
            >
              Shop All Products
              <svg
                className="ml-3 h-4 w-4 transform group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}