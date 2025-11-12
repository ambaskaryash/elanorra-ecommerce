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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 py-8">
          {items.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, ease: cubicBezier(0.16, 1, 0.3, 1) }}
              className="group relative rounded-2xl p-[1px] bg-gradient-to-br from-rose-200 via-pink-200 to-indigo-200"
            >
              <div className="relative rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow px-5 py-6 flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <item.icon className="h-6 w-6 text-gray-800" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-600 font-light">{item.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}