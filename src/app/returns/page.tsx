'use client';

import { motion } from 'framer-motion';

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-gray-900 mb-6">
          Returns & Exchanges
        </motion.h1>
        <div className="prose max-w-none text-gray-700">
          <p>
            We want you to love your purchase. If you need to return or exchange an item, please read the policy below.
          </p>
          <h2>Eligibility</h2>
          <p>
            Returns are accepted within 7 days of delivery for unused, undamaged items with original packaging.
          </p>
          <h2>Process</h2>
          <p>
  Contact support@example.com with your order number and item details. We will provide return instructions.
          </p>
          <h2>Refunds</h2>
          <p>
            Approved returns are refunded to the original payment method. Processing may take 5–7 business days.
          </p>
          <h2>Exclusions</h2>
          <p>
            Customized or final-sale items are not eligible for return unless defective.
          </p>
        </div>
      </div>
    </div>
  );
}