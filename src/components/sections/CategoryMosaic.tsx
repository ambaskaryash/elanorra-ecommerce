'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, cubicBezier } from 'framer-motion';

const items = [
  {
    title: 'Tableware',
    href: '/shop?category=tableware',
    image: '/images/hero-tableware.png',
  },
  {
    title: 'Gifting',
    href: '/shop?category=gifting',
    image: '/images/hero-gifting.png',
  },
  {
    title: 'Kids Collection',
    href: '/collections/kids-victoria',
    image: '/images/hero-kids.png',
  },
  {
    title: 'Stationery',
    href: '/shop?category=stationery',
    image: '/images/category-stationery.png',
  },
];

export default function CategoryMosaic() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-serif uppercase tracking-widest mb-4">Shop by Category</h2>
          <p className="text-sm text-gray-500 max-w-2xl mx-auto mt-4 tracking-wide">
            Explore curated categories that bring craftsmanship and story to life.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {items.map((item, idx) => (
            <Link key={idx} href={item.href} className="group relative rounded-2xl overflow-hidden">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, ease: cubicBezier(0.16, 1, 0.3, 1) }}
                className="relative aspect-[4/5]"
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300" />
                <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center">
                  <div>
                    <h3 className="text-white text-2xl font-serif uppercase tracking-widest">{item.title}</h3>
                    <div className="mt-4 inline-block text-white text-xs uppercase tracking-widest pb-1 border-b border-transparent group-hover:border-white transition-all duration-300">View Collection</div>
                  </div>
                </div>

                {/* Minimal outline on hover */}
                <div className="absolute inset-0 border border-white/0 group-hover:border-white/30 m-3 transition-colors duration-300" />
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}