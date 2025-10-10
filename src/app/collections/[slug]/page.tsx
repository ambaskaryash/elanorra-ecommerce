'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FunnelIcon } from '@heroicons/react/24/outline';
import ProductCard from '@/components/ui/ProductCard';
import { collections, products } from '@/lib/data/mock-data';
import { capitalizeFirst } from '@/lib/utils';

interface Props {
  params: {
    slug: string;
  };
}

const sortOptions = [
  { name: 'Featured', value: 'featured' },
  { name: 'Price: Low to High', value: 'price-asc' },
  { name: 'Price: High to Low', value: 'price-desc' },
  { name: 'Newest', value: 'newest' },
  { name: 'Best Selling', value: 'bestselling' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

export default function CollectionPage({ params }: Props) {
  const [sortBy, setSortBy] = useState('featured');
  
  // Find the collection
  const collection = collections.find(c => c.slug === params.slug);
  
  if (!collection) {
    notFound();
  }

  // Get products that belong to this collection
  const collectionProducts = products.filter(product => 
    product.collection === collection.name.toLowerCase() ||
    product.collection === collection.slug
  );

  const sortedProducts = useMemo(() => {
    const sorted = [...collectionProducts].sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'newest':
          return a.newArrival ? -1 : b.newArrival ? 1 : 0;
        case 'bestselling':
          return a.bestseller ? -1 : b.bestseller ? 1 : 0;
        case 'featured':
        default:
          return a.featured ? -1 : b.featured ? 1 : 0;
      }
    });
    return sorted;
  }, [collectionProducts, sortBy]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-[60vh] bg-gray-900 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={collection.image}
            alt={collection.name}
            fill
            className="object-cover opacity-70"
            priority
          />
        </div>
        <div className="relative z-10 h-full flex items-center justify-center text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl px-4"
          >
            <nav className="flex justify-center mb-6">
              <ol className="flex items-center space-x-2 text-sm text-white/80">
                <li><Link href="/" className="hover:text-white">Home</Link></li>
                <li>/</li>
                <li><Link href="/collections" className="hover:text-white">Collections</Link></li>
                <li>/</li>
                <li className="text-white font-medium">{collection.name}</li>
              </ol>
            </nav>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6">{collection.name} Collection</h1>
            <p className="text-xl md:text-2xl text-white/90 leading-relaxed max-w-2xl mx-auto">
              {collection.description}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Collection Info */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">About This Collection</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              The {collection.name} collection represents {collection.description.toLowerCase()}{' '}
              Each piece in this collection is carefully crafted to bring elegance and functionality 
              to your living space, creating an atmosphere that reflects your refined taste.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {collection.name} Products
              </h2>
              <p className="text-gray-600">
                {sortedProducts.length} {sortedProducts.length === 1 ? 'product' : 'products'} available
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <label htmlFor="sort" className="text-sm font-medium text-gray-700">
                Sort by:
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Products Grid */}
          {sortedProducts.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {sortedProducts.map((product) => (
                <motion.div key={product.id} variants={itemVariants}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                No products available in the {collection.name} collection yet.
              </div>
              <p className="text-gray-400 mb-6">
                Check back soon as we're constantly adding new pieces to our collections.
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center px-6 py-3 bg-rose-600 text-white font-medium rounded-md hover:bg-rose-700 transition-colors"
              >
                Explore Other Products
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Related Collections */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
              Explore Other Collections
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {collections
                .filter(c => c.id !== collection.id)
                .slice(0, 3)
                .map((relatedCollection) => (
                  <motion.div
                    key={relatedCollection.id}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.3 }}
                    className="group"
                  >
                    <Link href={`/collections/${relatedCollection.slug}`} className="block">
                      <div className="relative h-64 rounded-2xl overflow-hidden bg-gray-200 shadow-md group-hover:shadow-lg transition-shadow">
                        <Image
                          src={relatedCollection.image}
                          alt={relatedCollection.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4 text-white">
                          <h3 className="text-xl font-bold mb-1 group-hover:text-rose-200 transition-colors">
                            {relatedCollection.name}
                          </h3>
                          <p className="text-sm text-white/90 line-clamp-2">
                            {relatedCollection.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
            </div>

            <div className="text-center mt-12">
              <Link
                href="/collections"
                className="inline-flex items-center px-8 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
              >
                View All Collections
                <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}