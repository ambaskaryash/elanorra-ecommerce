'use client';

import { useEffect, useState } from 'react';
import { motion, Variants, cubicBezier } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

interface ApiCollectionPreview {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  featured?: boolean;
}

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

export default function CollectionsPage() {
  const [collections, setCollections] = useState<ApiCollectionPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCollections = async () => {
      try {
        const res = await fetch('/api/collections');
        if (res.ok) {
          const data = await res.json();
          setCollections(data.collections || []);
        }
      } catch (err) {
        console.error('Failed to fetch collections', err);
      } finally {
        setLoading(false);
      }
    };
    loadCollections();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-[50vh] bg-gray-900 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://res.cloudinary.com/demo/image/upload/w_1600,h_900,c_fill/ecommerce/banners/about-hero"
            alt="Elanorra Living Collections"
            fill
            className="object-cover opacity-60"
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
            <h1 className="text-5xl md:text-6xl font-bold mb-6">Our Collections</h1>
            <p className="text-xl md:text-2xl text-white/90 leading-relaxed">
              Discover curated collections that tell unique stories of design and craftsmanship
            </p>
          </motion.div>
        </div>
      </section>

      {/* Collections Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            <motion.div variants={itemVariants} className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Explore All Collections
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Each collection is thoughtfully curated to bring beauty and functionality to your living space
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {loading && (
                <div className="col-span-full text-center text-gray-500">Loading collections...</div>
              )}
              {!loading && collections.length === 0 && (
                <div className="col-span-full text-center text-gray-500">No collections found</div>
              )}
              {collections.map((collection, index) => (
                <motion.div
                  key={collection.id}
                  variants={itemVariants}
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                  className="group"
                >
                  <Link href={`/collections/${collection.slug}`} className="block">
                    <div className="relative h-80 rounded-2xl overflow-hidden bg-gray-200 shadow-lg group-hover:shadow-2xl transition-all duration-300">
                      {/* Background Image */}
                      {collection.image ? (
                        <Image
                          src={collection.image}
                          alt={collection.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />
                      )}
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      
                      {/* Content */}
                      <div className="absolute inset-0 flex items-end p-6">
                        <div className="text-white">
                          <h3 className="text-2xl font-bold mb-2 group-hover:text-rose-200 transition-colors">
                            {collection.name}
                          </h3>
                          <p className="text-sm text-white/90 line-clamp-3 mb-4">
                            {collection.description || 'Explore curated pieces from this collection.'}
                          </p>
                          <div className="flex items-center">
                            <span className="inline-flex items-center text-sm font-medium text-white group-hover:text-rose-200 transition-colors">
                              Explore Collection
                              <svg
                                className="ml-2 h-4 w-4 transform group-hover:translate-x-2 transition-transform duration-300"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                              </svg>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Featured Badge */}
                      {collection.featured && (
                        <div className="absolute top-4 left-4 bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                          Featured
                        </div>
                      )}

                      {/* Collection Number */}
                      <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white text-xs font-bold w-10 h-10 rounded-full flex items-center justify-center border border-white/30">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Can't Find What You're Looking For?
            </h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Our design consultants can help you create a custom collection tailored to your unique style and needs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/services"
                className="inline-flex items-center px-8 py-4 bg-rose-600 text-white font-medium rounded-md hover:bg-rose-700 transition-colors"
              >
                Book Consultation
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-4 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
              >
                Get in Touch
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}