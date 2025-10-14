'use client';

import { motion } from 'framer-motion';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-gray-900 mb-6">
          Privacy Policy
        </motion.h1>
        <div className="prose max-w-none text-gray-700">
          <p>
  We value your privacy. This policy explains how we collect, use, and protect your personal information.
          </p>
          <h2>Information We Collect</h2>
          <p>
            We collect information you provide (such as name, email, phone, addresses) and usage data (such as pages visited and actions taken).
          </p>
          <h2>Use of Information</h2>
          <p>
            We use your information to process orders, provide customer support, improve our services, and send important updates.
          </p>
          <h2>Third-Party Services</h2>
          <p>
            We may use trusted third-party services (e.g., payment providers) that process data under contractual safeguards.
          </p>
          <h2>Data Security</h2>
          <p>
            We implement reasonable security measures to protect your data. No method of transmission is 100% secure.
          </p>
          <h2>Your Rights</h2>
          <p>
  You can request to update or delete your data where applicable. Contact us at support@example.com.
          </p>
          <h2>Contact</h2>
          <p>
  If you have questions about this policy, contact us at privacy@example.com.
          </p>
        </div>
      </div>
    </div>
  );
}