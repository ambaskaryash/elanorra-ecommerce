'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export default function AboutSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Content - Images */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="relative h-48 rounded-lg overflow-hidden shadow-lg">
                  <Image
                    src="https://res.cloudinary.com/demo/image/upload/w_400,h_300,c_fill/ecommerce/about/studio-workspace-1"
                    alt="Handcrafted Ceramics"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
                <div className="relative h-64 rounded-lg overflow-hidden shadow-lg">
                  <Image
                    src="https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_fill/ecommerce/about/studio-workspace-2"
                    alt="Elegant Table Setting"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
              </div>
              <div className="space-y-6 pt-8">
                <div className="relative h-64 rounded-lg overflow-hidden shadow-lg">
                  <Image
                    src="https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_fill/ecommerce/about/studio-workspace-3"
                    alt="Tea Set Collection"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
                <div className="relative h-48 rounded-lg overflow-hidden shadow-lg">
                  <Image
                    src="https://res.cloudinary.com/demo/image/upload/w_400,h_300,c_fill/ecommerce/about/studio-workspace-4"
                    alt="Artisan Workshop"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
              </div>
            </div>
            
            {/* Decorative Element */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-rose-100 rounded-full opacity-50" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-stone-100 rounded-full opacity-50" />
          </motion.div>

          {/* Right Content - Text */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-8"
          >
            {/* Badge */}
            <div className="inline-flex items-center px-3 py-1 bg-stone-100 rounded-full text-sm font-medium text-stone-600">
              <span className="w-2 h-2 bg-stone-400 rounded-full mr-2"></span>
              Our Story
            </div>

            {/* Heading */}
            <div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-gray-900 mb-4 leading-tight">
                Crafting Beauty
                <span className="block font-serif italic text-rose-600">
                  for Generations
                </span>
              </h2>
              <div className="w-16 h-0.5 bg-rose-400"></div>
            </div>

            {/* Description */}
            <div className="space-y-6 text-lg leading-relaxed text-gray-600">
              <p>
                For over 15 years, our brand has been synonymous with exceptional craftsmanship and timeless design. 
                Born from a passion for transforming everyday objects into works of art, we create pieces that tell stories 
                and make moments memorable.
              </p>
              
              <p>
                Each item in our collection is carefully curated or handcrafted by skilled artisans who understand that 
                true luxury lies not just in materials, but in the love and attention poured into every detail. 
                From our signature tableware to our bespoke stationery, every piece reflects our commitment to excellence.
              </p>
            </div>

            {/* Values */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 bg-rose-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Quality First</h4>
                  <p className="text-sm text-gray-600">Premium materials and meticulous attention to detail</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Handcrafted</h4>
                  <p className="text-sm text-gray-600">Made with love by skilled artisans</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Sustainable</h4>
                  <p className="text-sm text-gray-600">Environmentally conscious practices</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Innovation</h4>
                  <p className="text-sm text-gray-600">Traditional meets contemporary design</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-4">
              <motion.a
                href="/about"
                whileHover={{ x: 5 }}
                className="inline-flex items-center text-rose-600 font-semibold hover:text-rose-700 transition-colors"
              >
                Learn more about our journey
                <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </motion.a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}