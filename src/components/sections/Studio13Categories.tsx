'use client';

import { motion, Variants, cubicBezier } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { categories } from '@/lib/data/mock-data';

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
      duration: 0.6,
      ease: cubicBezier(0.16, 1, 0.3, 1),
    },
  },
};

export default function CategoriesSection() {
  return (
    <section className="py-24 bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
        >
          {/* Section Header */}
          <motion.div variants={itemVariants} className="text-center mb-16">
            <div className="inline-flex items-center px-3 py-1 bg-rose-100 rounded-full text-sm font-medium text-rose-600 mb-4">
              <span className="w-2 h-2 bg-rose-400 rounded-full mr-2"></span>
              Shop by Category
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-gray-900 mb-6 leading-tight">
              Discover Your
              <span className="block font-serif italic text-rose-600">
                Perfect Style
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              From timeless tableware to elegant stationery, explore our carefully curated categories 
              designed to enhance every aspect of your lifestyle.
            </p>
          </motion.div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Category - Tableware */}
            <motion.div
              variants={itemVariants}
              className="lg:col-span-2 group cursor-pointer"
            >
              <Link href="/shop/tableware" className="block">
                <div className="relative h-[500px] rounded-2xl overflow-hidden bg-gradient-to-br from-rose-100 to-orange-100">
                  <Image
                    src="https://res.cloudinary.com/demo/image/upload/w_800,h_600,c_fill/ecommerce/products/vasant-tea-cup-set"
                    alt="Tableware Collection"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 768px) 100vw, 66vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  
                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-8">
                    <div className="text-white">
                      <div className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium text-white mb-3">
                        Featured Category
                      </div>
                      <h3 className="text-3xl md:text-4xl font-light mb-3 group-hover:text-rose-200 transition-colors">
                        Tableware
                      </h3>
                      <p className="text-white/90 text-lg mb-6 max-w-lg">
                        From our hands to your home, with love. Tableware that whispers stories of tradition.
                      </p>
                      <div className="flex items-center text-white group-hover:text-rose-200 transition-colors">
                        <span className="font-medium mr-2">Explore Collection</span>
                        <motion.svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          whileHover={{ x: 5 }}
                          transition={{ type: "spring", stiffness: 400 }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </motion.svg>
                      </div>
                    </div>
                  </div>

                  {/* Floating Badge */}
                  <div className="absolute top-6 right-6">
                    <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-gray-900">
                      Best Seller
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Secondary Categories */}
            <div className="space-y-8">
              {/* Stationery */}
              <motion.div
                variants={itemVariants}
                className="group cursor-pointer"
              >
                <Link href="/shop/stationery" className="block">
                  <div className="relative h-[240px] rounded-2xl overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100">
                    <Image
                      src="https://res.cloudinary.com/demo/image/upload/w_600,h_400,c_fill/ecommerce/categories/stationery-category"
                      alt="Stationery Collection"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                    
                    <div className="absolute inset-0 flex flex-col justify-end p-6">
                      <div className="text-white">
                        <h3 className="text-xl font-medium mb-2 group-hover:text-blue-200 transition-colors">
                          Stationery
                        </h3>
                        <p className="text-white/80 text-sm mb-3">
                          Beautiful stationery for all ages
                        </p>
                        <div className="flex items-center text-white group-hover:text-blue-200 transition-colors">
                          <span className="text-sm font-medium mr-1">Shop Now</span>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>

              {/* Gifting */}
              <motion.div
                variants={itemVariants}
                className="group cursor-pointer"
              >
                <Link href="/shop/gifting" className="block">
                  <div className="relative h-[240px] rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-100 to-teal-100">
                    <Image
                      src="https://res.cloudinary.com/demo/image/upload/w_600,h_400,c_fill/ecommerce/categories/dining-category"
                      alt="Gifting Collection"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                    
                    <div className="absolute inset-0 flex flex-col justify-end p-6">
                      <div className="text-white">
                        <h3 className="text-xl font-medium mb-2 group-hover:text-emerald-200 transition-colors">
                          Gifting
                        </h3>
                        <p className="text-white/80 text-sm mb-3">
                          Thoughtfully curated gift sets
                        </p>
                        <div className="flex items-center text-white group-hover:text-emerald-200 transition-colors">
                          <span className="text-sm font-medium mr-1">Shop Now</span>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Special Badge */}
                    <div className="absolute top-4 left-4">
                      <div className="bg-emerald-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                        New
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            </div>
          </div>

          {/* Subcategories Grid */}
          <motion.div
            variants={containerVariants}
            className="mt-16"
          >
            <div className="text-center mb-12">
              <h3 className="text-2xl font-light text-gray-900 mb-4">
                Browse by
                <span className="font-serif italic text-rose-600"> Subcategory</span>
              </h3>
              <div className="w-16 h-0.5 bg-rose-400 mx-auto"></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Subcategory Items */}
              {[
                { name: 'Dining', href: '/shop/tableware/dining', icon: '🍽️' },
                { name: 'Cups & Mugs', href: '/shop/tableware/cups-mugs', icon: '☕' },
                { name: 'Trays', href: '/shop/tableware/trays-cutlery', icon: '🍰' },
                { name: "Children's Sets", href: '/shop/tableware/childrens-sets', icon: '👶' },
                { name: 'Candles', href: '/shop/tableware/candles-gifting', icon: '🕯️' }
              ].map((subcategory, index) => (
                <motion.div
                  key={subcategory.name}
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                  className="group"
                >
                  <Link href={subcategory.href} className="block">
                    <div className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
                      <div className="text-3xl mb-3">{subcategory.icon}</div>
                      <h4 className="font-medium text-gray-900 group-hover:text-rose-600 transition-colors">
                        {subcategory.name}
                      </h4>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div variants={itemVariants} className="text-center mt-16">
            <Link
              href="/shop"
              className="inline-flex items-center px-8 py-4 bg-gray-900 text-white font-medium rounded-none hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Shop All Categories
              <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}