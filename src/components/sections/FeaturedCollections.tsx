'use client';

import { useState, useEffect } from 'react';
import { motion, Variants, cubicBezier } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
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

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  featured: boolean;
  productCount: number;
  sampleProducts: Array<{
    id: string;
    name: string;
    slug: string;
    price: number;
    image: string | null;
  }>;
}

export default function FeaturedCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/collections?featured=true');
        if (!response.ok) {
          throw new Error('Failed to fetch collections');
        }
        const data = await response.json();
        setCollections(data.collections || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-light text-gray-900 mb-6 tracking-wide">
              Collections
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto font-light leading-relaxed">
              Each collection tells a unique story through beautiful design and craftsmanship.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-72 bg-gray-300 mb-4"></div>
                <div className="h-4 bg-gray-300 mb-2"></div>
                <div className="h-3 bg-gray-300 mb-3"></div>
                <div className="h-3 bg-gray-300 w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-light text-gray-900 mb-6">Collections</h2>
            <p className="text-red-600">Error loading collections: {error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
        >
          {/* Section Header */}
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-light text-gray-900 mb-6 tracking-wide">
              Collections
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto font-light leading-relaxed">
              Each collection tells a unique story through beautiful design and craftsmanship. 
              From traditional Indian motifs to contemporary elegance.
            </p>
          </motion.div>

          {/* Collections Grid */}
          <motion.div 
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
          >
            {collections.slice(0, 8).map((collection, index) => (
              <motion.div
                key={collection.id}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3, ease: cubicBezier(0.16, 1, 0.3, 1) }}
                className="group"
              >
                <Link href={`/collections/${collection.slug}`} className="block">
                  <div className="relative h-72 overflow-hidden bg-stone-100 group-hover:shadow-lg transition-shadow duration-300">
                    {/* Background Image */}
                    <Image
                      src={imageErrors[collection.id] ? '/images/placeholder.svg' : (collection.image ?? '/images/placeholder.svg')}
                      alt={collection.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      onError={() => setImageErrors(prev => ({ ...prev, [collection.id]: true }))}
                    />
                    
                    {/* Subtle Overlay */}
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300" />
                  </div>
                  
                  {/* Content Below Image */}
                  <div className="pt-4">
                    <h3 className="text-xl font-light text-gray-900 mb-2 group-hover:text-gray-600 transition-colors tracking-wide">
                      {collection.name}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3 font-light">
                      {collection.description}
                    </p>
                    <span className="inline-flex items-center text-xs font-medium text-gray-900 group-hover:text-gray-600 transition-colors uppercase tracking-wider">
                      Explore
                      <svg
                        className="ml-1 h-3 w-3 transform group-hover:translate-x-1 transition-transform"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* View All Collections Link */}
          <motion.div variants={itemVariants} className="text-center mt-16">
            <Link
              href="/collections"
              className="inline-flex items-center px-8 py-4 bg-transparent border border-gray-900 text-gray-900 font-light hover:bg-gray-900 hover:text-white transition-all duration-300 tracking-wider uppercase text-sm"
            >
              View All Collections
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