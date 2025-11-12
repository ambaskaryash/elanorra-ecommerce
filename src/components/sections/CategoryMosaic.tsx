'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, cubicBezier } from 'framer-motion';

const items = [
  {
    title: 'Tableware',
    href: '/shop?category=tableware',
    image: '/images/test-product-1.jpg',
  },
  {
    title: 'Gifting',
    href: '/shop?category=gifting',
    image: '/images/test-product-2.jpg',
  },
  {
    title: 'Kids Collection',
    href: '/collections/kids-victoria',
    image: '/images/placeholder.jpg',
  },
  {
    title: 'Home Decor',
    href: '/shop?category=decor',
    image: '/images/placeholder.jpg',
  },
];

export default function CategoryMosaic() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl heading-xl mb-3 tracking-wide">Shop by Category</h2>
          <div className="mx-auto h-1 w-24 rounded-full ribbon-bronze" />
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto mt-4 font-light">
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 p-6 flex items-end">
                  <div>
                    <h3 className="text-white text-xl font-light tracking-wide">{item.title}</h3>
                    <div className="mt-2 inline-block bg-white/90 text-gray-900 text-xs px-3 py-1 rounded-full uppercase tracking-wider">Explore</div>
                  </div>
                </div>

                {/* Decorative gradient border on hover (bronze) */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-[var(--accent)] via-[color:rgba(186,156,109,0.55)] to-[color:rgba(60,47,36,0.40)]" />
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}