'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface Section {
  id: string;
  title: string;
  content: string[];
}

const termsData: Section[] = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    content: [
      'By accessing and using the Elanorra Living website and services, you accept and agree to be bound by the terms and provision of this agreement.',
      'If you do not agree to abide by the above, please do not use this service.',
      'These terms apply to all visitors, users, and others who access or use the service.'
    ]
  },
  {
    id: 'definitions',
    title: '2. Definitions',
    content: [
      '"Company" (referred to as "we", "us", or "our") refers to Elanorra Living.',
      '"Service" refers to the website, mobile application, and all related services provided by Elanorra Living.',
      '"User" or "Customer" refers to any individual who uses our Service.',
      '"Products" refers to all items available for purchase through our Service.'
    ]
  },
  {
    id: 'use-license',
    title: '3. Use License',
    content: [
      'Permission is granted to temporarily download one copy of the materials on Elanorra Living\'s website for personal, non-commercial transitory viewing only.',
      'This is the grant of a license, not a transfer of title, and under this license you may not:',
      '• Modify or copy the materials',
      '• Use the materials for any commercial purpose or for any public display',
      '• Attempt to reverse engineer any software contained on the website',
      '• Remove any copyright or other proprietary notations from the materials'
    ]
  },
  {
    id: 'account-registration',
    title: '4. Account Registration',
    content: [
      'To access certain features of our Service, you must register for an account.',
      'You must provide accurate, current, and complete information during registration.',
      'You are responsible for safeguarding your password and all activities under your account.',
      'You must notify us immediately of any unauthorized use of your account.',
      'We reserve the right to suspend or terminate accounts that violate these terms.'
    ]
  },
  {
    id: 'orders-payments',
    title: '5. Orders and Payments',
    content: [
      'All orders are subject to acceptance and availability.',
      'Prices are subject to change without notice.',
      'Payment must be received before order processing.',
      'We accept various payment methods as displayed during checkout.',
      'All transactions are processed securely through our payment partners.',
      'You agree to pay all charges incurred by you or any users of your account.'
    ]
  },
  {
    id: 'shipping-delivery',
    title: '6. Shipping and Delivery',
    content: [
      'Delivery times are estimates and not guaranteed.',
      'Risk of loss and title for products pass to you upon delivery to the carrier.',
      'Shipping costs are calculated based on weight, dimensions, and destination.',
      'We are not responsible for delays caused by shipping carriers or customs.',
      'International orders may be subject to customs duties and taxes.'
    ]
  },
  {
    id: 'returns-refunds',
    title: '7. Returns and Refunds',
    content: [
      'Returns must be initiated within 30 days of delivery.',
      'Items must be in original condition with all packaging and tags.',
      'Custom or personalized items are not eligible for return.',
      'Return shipping costs are the responsibility of the customer unless the item is defective.',
      'Refunds will be processed within 5-10 business days after we receive the returned item.',
      'Refunds will be issued to the original payment method.'
    ]
  },
  {
    id: 'intellectual-property',
    title: '8. Intellectual Property',
    content: [
      'All content on this website is owned by Elanorra Living or its licensors.',
      'This includes but is not limited to text, graphics, logos, images, and software.',
      'You may not reproduce, distribute, or create derivative works without written permission.',
      'Product names and descriptions are trademarks of their respective owners.',
      'Any feedback or suggestions you provide may be used by us without compensation.'
    ]
  },
  {
    id: 'prohibited-uses',
    title: '9. Prohibited Uses',
    content: [
      'You may not use our Service for any unlawful purpose or to solicit others to perform unlawful acts.',
      'You may not violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances.',
      'You may not transmit or procure the sending of any advertising or promotional material without our prior written consent.',
      'You may not impersonate or attempt to impersonate the Company, a Company employee, another user, or any other person or entity.',
      'You may not engage in any other conduct that restricts or inhibits anyone\'s use or enjoyment of the website.'
    ]
  },
  {
    id: 'privacy-policy',
    title: '10. Privacy Policy',
    content: [
      'Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service.',
      'By using our Service, you agree to the collection and use of information in accordance with our Privacy Policy.',
      'We implement appropriate security measures to protect your personal information.',
      'We do not sell, trade, or rent your personal information to third parties without your consent.'
    ]
  },
  {
    id: 'disclaimers',
    title: '11. Disclaimers',
    content: [
      'The information on this website is provided on an "as is" basis.',
      'To the fullest extent permitted by law, this Company excludes all representations, warranties, conditions, and terms.',
      'We do not warrant that the website will be constantly available or available at all.',
      'Product colors may vary slightly from those shown on your monitor due to display settings.',
      'We make no guarantees about the accuracy of product descriptions or images.'
    ]
  },
  {
    id: 'limitation-liability',
    title: '12. Limitation of Liability',
    content: [
      'In no event shall Elanorra Living be liable for any indirect, incidental, special, consequential, or punitive damages.',
      'Our total liability to you for all damages shall not exceed the amount paid by you for the specific product or service.',
      'Some jurisdictions do not allow the exclusion of certain warranties or the limitation of liability for consequential damages.',
      'In such jurisdictions, our liability will be limited to the maximum extent permitted by law.'
    ]
  },
  {
    id: 'modifications',
    title: '13. Modifications to Terms',
    content: [
      'We reserve the right to modify these terms at any time.',
      'Changes will be effective immediately upon posting on the website.',
      'Your continued use of the Service after changes constitutes acceptance of the new terms.',
      'We recommend reviewing these terms periodically for any changes.',
      'Material changes will be communicated via email or prominent website notice.'
    ]
  },
  {
    id: 'governing-law',
    title: '14. Governing Law',
    content: [
      'These terms shall be governed by and construed in accordance with the laws of India.',
      'Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.',
      'If any provision of these terms is found to be unenforceable, the remaining provisions will remain in full force and effect.',
      'Our failure to enforce any right or provision will not constitute a waiver of such right or provision.'
    ]
  },
  {
    id: 'contact',
    title: '15. Contact Information',
    content: [
      'If you have any questions about these Terms of Service, please contact us:',
      'Email: info@elanorraliving.in',
      'Phone: +91 9876543210',
      'Address: Mumbai, Maharashtra, India',
      'We will respond to your inquiries within 48 hours during business days.'
    ]
  }
];

export default function TermsOfService() {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const expandAll = () => {
    setExpandedSections(termsData.map(section => section.id));
  };

  const collapseAll = () => {
    setExpandedSections([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-lg text-gray-600 mb-6">
            Last updated: {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={expandAll}
              className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Introduction */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <p className="text-gray-700 leading-relaxed">
            Welcome to Elanorra Living. These Terms of Service ("Terms") govern your use of our website 
            and services. Please read these Terms carefully before using our Service. By accessing or 
            using our Service, you agree to be bound by these Terms.
          </p>
        </div>

        {/* Terms Sections */}
        <div className="space-y-4">
          {termsData.map((section) => {
            const isExpanded = expandedSections.includes(section.id);
            
            return (
              <div key={section.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
                  {isExpanded ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                
                {isExpanded && (
                  <div className="px-8 pb-6">
                    <div className="space-y-4">
                      {section.content.map((paragraph, index) => (
                        <p key={index} className="text-gray-700 leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Have questions about our Terms of Service?
          </p>
          <Link 
            href="/contact" 
            className="inline-flex items-center px-6 py-3 bg-rose-600 text-white font-medium rounded-lg hover:bg-rose-700 transition-colors"
          >
            Contact Us
          </Link>
        </div>

        {/* Related Links */}
        <div className="mt-8 text-center">
          <div className="flex justify-center space-x-6 text-sm">
            <Link href="/legal/privacy" className="text-rose-600 hover:text-rose-700">
              Privacy Policy
            </Link>
            <Link href="/legal/cookies" className="text-rose-600 hover:text-rose-700">
              Cookie Policy
            </Link>
            <Link href="/returns" className="text-rose-600 hover:text-rose-700">
              Return Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}