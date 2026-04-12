'use client';

import { TruckIcon, ArrowPathIcon, ShieldCheckIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { motion, cubicBezier } from 'framer-motion';

const items = [
  { icon: TruckIcon, title: 'Free & Fast Shipping', desc: 'On orders above ₹999' },
  { icon: ArrowPathIcon, title: 'Easy Returns', desc: '7-day hassle-free returns' },
  { icon: ShieldCheckIcon, title: 'Secure Checkout', desc: 'Protected payments & privacy' },
  { icon: SparklesIcon, title: 'Handcrafted Quality', desc: 'Lovingly made, built to last' },
];

export default function BenefitsBar() {
  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
          {items.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, ease: cubicBezier(0.16, 1, 0.3, 1) }}
              className="group relative"
            >
              <div className="group flex flex-col items-center text-center p-8 border border-gray-100 hover:border-gray-200 transition-colors bg-stone-50/30">
                <div className="flex-shrink-0 mb-4">
                  <item.icon className="h-8 w-8 text-gray-900 stroke-[1]" />
                </div>
                <div>
                  <p className="text-sm font-serif uppercase tracking-widest text-gray-900 mb-2">{item.title}</p>
                  <p className="text-xs text-gray-500 tracking-wide font-light">{item.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}