'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, cubicBezier } from 'framer-motion';

export default function EditorialBanner() {
  return (
    <section className="relative bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Text Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: cubicBezier(0.16, 1, 0.3, 1) }}
            className="max-w-xl mx-auto lg:mx-0 text-center lg:text-left"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-gray-900 mb-6 uppercase tracking-widest leading-tight">
              Stories of Craft & Design
            </h2>
            <p className="text-gray-500 text-base sm:text-lg tracking-wide leading-relaxed mb-10">
              Discover pieces that blend tradition and modernity—crafted with love, meant to endure. Every object has a story waiting to unfold in your home.
            </p>
            <Link
              href="/collections"
              className="inline-block border border-gray-900 text-gray-900 px-10 py-3 text-xs uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all duration-300"
            >
              Explore Collections
            </Link>
          </motion.div>

          {/* Image Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: cubicBezier(0.16, 1, 0.3, 1) }}
            className="relative h-[60vh] lg:h-[80vh] w-full"
          >
            <Image
              src="/images/editorial-craft.png"
              alt="Crafted Stories"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </motion.div>

        </div>
      </div>
    </section>
  );
}