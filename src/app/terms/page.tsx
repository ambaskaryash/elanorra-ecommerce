'use client';

import { motion } from 'framer-motion';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-gray-900 mb-6">
          Terms of Service
        </motion.h1>
        <div className="prose max-w-none text-gray-700">
          <p>
  These Terms govern your use of our services and website. By using our site, you agree to these Terms.
          </p>
          <h2>Purchases</h2>
          <p>
            All purchases are subject to product availability. Prices may change without notice. We reserve the right to refuse orders.
          </p>
          <h2>Accounts</h2>
          <p>
            You are responsible for maintaining account confidentiality and for all activities under your account.
          </p>
          <h2>Intellectual Property</h2>
          <p>
  All content, design, and images are owned by the site owner or its licensors and protected by applicable laws.
          </p>
          <h2>Limitation of Liability</h2>
          <p>
  We are not liable for indirect or consequential damages. Use our services at your own risk.
          </p>
          <h2>Contact</h2>
          <p>
  For questions regarding these Terms, contact us at legal@example.com.
          </p>
        </div>
      </div>
    </div>
  );
}