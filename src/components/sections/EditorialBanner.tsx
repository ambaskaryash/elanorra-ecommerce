'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, cubicBezier } from 'framer-motion';

export default function EditorialBanner() {
  return (
    <section className="relative py-0">
      <div className="relative h-[52vh] sm:h-[60vh] lg:h-[68vh]">
        <Image
          src="/images/placeholder.jpg"
          alt="Crafted Stories"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[color:rgba(138,106,63,0.28)] via-[color:rgba(186,156,109,0.18)] to-transparent" />
        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: cubicBezier(0.16, 1, 0.3, 1) }}
              className="max-w-2xl"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white mb-4 tracking-wide">Stories of Craft & Design</h2>
              <p className="text-white/90 text-base sm:text-lg font-light leading-relaxed mb-8">
                Discover pieces that blend tradition and modernity—crafted with love, meant to endure.
              </p>
              <Link
                href="/collections"
                className="inline-block bg-transparent border-2 border-white text-white px-8 py-3 text-sm sm:text-base font-light hover:bg-white hover:text-gray-900 transition-all duration-300 tracking-wider uppercase"
              >
                Explore Collections
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}