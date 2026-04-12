'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

const faqs = [
  {
    category: 'Orders & Shipping',
    items: [
      {
        q: 'How long does delivery take?',
        a: 'Standard delivery takes 5–7 business days across India. We offer express delivery (2–3 days) for select pin codes. International orders typically take 10–15 business days.',
      },
      {
        q: 'Do you ship internationally?',
        a: 'Yes, we ship to select countries worldwide. International shipping charges and timelines vary by destination. Please contact us at info@elanorraliving.in for specific country availability.',
      },
      {
        q: 'How can I track my order?',
        a: 'Once your order is dispatched, you will receive a tracking link via email and SMS. You can also track your order under My Account → Orders.',
      },
      {
        q: 'Is there free shipping?',
        a: 'We offer free shipping on all orders above ₹1,499. For orders below this threshold, a flat shipping fee applies based on your location.',
      },
    ],
  },
  {
    category: 'Products',
    items: [
      {
        q: 'Are all products handcrafted?',
        a: 'Yes. Every piece at ElanorraLiving is thoughtfully designed and crafted by skilled artisans. We work closely with craftspeople across India to bring you products that blend tradition with modern aesthetics.',
      },
      {
        q: 'Can I request custom or personalized products?',
        a: 'Absolutely. We offer bespoke gifting solutions for corporate and personal orders. Please contact us at info@elanorraliving.in with your requirements and we'll get back to you within 48 hours.',
      },
      {
        q: 'Are the ceramics food-safe?',
        a: 'Yes. All our ceramic tableware is food-safe, lead-free, and tested to meet safety standards. They are microwave and dishwasher safe unless otherwise noted on the product page.',
      },
      {
        q: 'How do I care for my ceramic products?',
        a: 'We recommend hand-washing for longevity, though most pieces are dishwasher-safe on the gentle cycle. Avoid sudden temperature changes. Do not use abrasive scrubbers.',
      },
    ],
  },
  {
    category: 'Returns & Refunds',
    items: [
      {
        q: 'What is your return policy?',
        a: 'We accept returns within 7 days of delivery for unused, undamaged items in their original packaging. Customised or final-sale items are not eligible for return unless defective.',
      },
      {
        q: 'How do I initiate a return?',
        a: 'Email us at info@elanorraliving.in with your order number and reason for return. We will provide instructions and arrange a pickup. Refunds are processed within 5–7 business days of receiving the return.',
      },
      {
        q: 'What if my item arrives damaged?',
        a: 'We take great care in packaging, but if your item arrives damaged, please email us within 48 hours of delivery with photos. We will arrange a replacement or full refund at no cost to you.',
      },
    ],
  },
  {
    category: 'Payments',
    items: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit/debit cards, UPI, net banking, and wallets via Razorpay. All transactions are secured with 256-bit SSL encryption.',
      },
      {
        q: 'Is it safe to use my card on your website?',
        a: 'Yes. Our payment gateway is powered by Razorpay, which is PCI DSS compliant. We never store your card details on our servers.',
      },
      {
        q: 'Can I use a coupon code?',
        a: 'Yes, you can apply coupon codes at checkout. Subscribe to our newsletter to receive exclusive discount codes directly in your inbox.',
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-sm font-medium text-gray-900 uppercase tracking-wide pr-8">{q}</span>
        <span className="flex-shrink-0">
          {open ? (
            <MinusIcon className="h-4 w-4 text-gray-900" />
          ) : (
            <PlusIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-900 transition-colors" />
          )}
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm text-gray-500 leading-relaxed tracking-wide">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="border-b border-gray-100 py-20 text-center">
        <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-4">Help Centre</p>
        <h1 className="text-4xl sm:text-5xl font-serif uppercase tracking-widest text-gray-900 mb-6">
          Frequently Asked Questions
        </h1>
        <p className="text-sm text-gray-500 max-w-lg mx-auto tracking-wide">
          Everything you need to know about ElanorraLiving — orders, products, returns and more.
        </p>
      </section>

      {/* FAQ Sections */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="space-y-16">
          {faqs.map((section) => (
            <div key={section.category}>
              <h2 className="text-[10px] uppercase tracking-widest font-bold text-gray-900 mb-6 pb-4 border-b border-gray-900">
                {section.category}
              </h2>
              <div>
                {section.items.map((item) => (
                  <FAQItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Still Need Help */}
        <div className="mt-20 border border-gray-200 p-10 text-center">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-3">Still have questions?</p>
          <h3 className="text-2xl font-serif uppercase tracking-widest text-gray-900 mb-4">We're here to help</h3>
          <p className="text-sm text-gray-500 mb-8 tracking-wide">
            Our team is happy to assist you with any questions not answered above.
          </p>
          <Link
            href="/contact"
            className="inline-block border border-gray-900 bg-gray-900 text-white text-[10px] uppercase tracking-widest px-10 py-4 hover:bg-white hover:text-gray-900 transition-all duration-300"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  );
}
