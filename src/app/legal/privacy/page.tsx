'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDownIcon, ChevronUpIcon, ShieldCheckIcon, EyeIcon, LockClosedIcon } from '@heroicons/react/24/outline';

interface Section {
  id: string;
  title: string;
  content: string[];
}

const privacyData: Section[] = [
  {
    id: 'introduction',
    title: '1. Introduction',
    content: [
      'Elanorra Living ("we", "our", or "us") is committed to protecting your privacy and personal information.',
      'This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.',
      'Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, please do not access the site.',
      'We reserve the right to make changes to this Privacy Policy at any time and for any reason.'
    ]
  },
  {
    id: 'information-collection',
    title: '2. Information We Collect',
    content: [
      'Personal Information: We collect information you provide directly, such as when you create an account, make a purchase, or contact us.',
      'This may include: Name, email address, phone number, shipping address, billing address, and payment information.',
      'Account Information: Username, password, purchase history, and preferences.',
      'Automatically Collected Information: IP address, browser type, device information, and usage data.',
      'Cookies and Tracking: We use cookies and similar technologies to enhance your experience and analyze site usage.'
    ]
  },
  {
    id: 'information-use',
    title: '3. How We Use Your Information',
    content: [
      'To process and fulfill your orders and transactions.',
      'To communicate with you about your account, orders, and our services.',
      'To provide customer support and respond to your inquiries.',
      'To personalize your shopping experience and recommend products.',
      'To send you marketing communications (with your consent).',
      'To improve our website, products, and services.',
      'To detect, prevent, and address fraud and security issues.',
      'To comply with legal obligations and enforce our terms.'
    ]
  },
  {
    id: 'information-sharing',
    title: '4. Information Sharing and Disclosure',
    content: [
      'We do not sell, trade, or rent your personal information to third parties.',
      'Service Providers: We may share information with trusted third-party service providers who assist us in operating our business.',
      'Payment Processors: Payment information is shared with secure payment processors to complete transactions.',
      'Shipping Partners: Shipping information is shared with delivery partners to fulfill orders.',
      'Legal Requirements: We may disclose information when required by law or to protect our rights and safety.',
      'Business Transfers: Information may be transferred in connection with a merger, acquisition, or sale of assets.'
    ]
  },
  {
    id: 'data-security',
    title: '5. Data Security',
    content: [
      'We implement appropriate technical and organizational security measures to protect your personal information.',
      'All payment transactions are processed through secure, encrypted connections (SSL/TLS).',
      'We use industry-standard security protocols and regularly update our security practices.',
      'Access to personal information is restricted to authorized personnel only.',
      'We regularly monitor our systems for potential vulnerabilities and attacks.',
      'However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.'
    ]
  },
  {
    id: 'cookies-tracking',
    title: '6. Cookies and Tracking Technologies',
    content: [
      'Essential Cookies: Required for basic website functionality and security.',
      'Performance Cookies: Help us understand how visitors interact with our website.',
      'Functional Cookies: Remember your preferences and personalize your experience.',
      'Marketing Cookies: Used to deliver relevant advertisements and track campaign effectiveness.',
      'You can control cookie preferences through your browser settings.',
      'Disabling certain cookies may limit website functionality.'
    ]
  },
  {
    id: 'third-party-services',
    title: '7. Third-Party Services',
    content: [
      'Our website may contain links to third-party websites and services.',
      'We are not responsible for the privacy practices of these third parties.',
      'We use third-party analytics services (like Google Analytics) to understand website usage.',
      'Social media plugins may collect information about your interactions.',
      'Payment processors have their own privacy policies governing payment data.',
      'We recommend reviewing the privacy policies of any third-party services you use.'
    ]
  },
  {
    id: 'data-retention',
    title: '8. Data Retention',
    content: [
      'We retain personal information for as long as necessary to fulfill the purposes outlined in this policy.',
      'Account information is retained while your account is active and for a reasonable period after closure.',
      'Transaction records are kept for accounting and legal compliance purposes.',
      'Marketing communications data is retained until you unsubscribe.',
      'We may retain certain information for longer periods if required by law.',
      'When information is no longer needed, we securely delete or anonymize it.'
    ]
  },
  {
    id: 'your-rights',
    title: '9. Your Rights and Choices',
    content: [
      'Access: You can request access to the personal information we hold about you.',
      'Correction: You can request correction of inaccurate or incomplete information.',
      'Deletion: You can request deletion of your personal information, subject to legal requirements.',
      'Portability: You can request a copy of your data in a structured, machine-readable format.',
      'Opt-out: You can unsubscribe from marketing communications at any time.',
      'Account Settings: You can update your preferences and information through your account settings.'
    ]
  },
  {
    id: 'childrens-privacy',
    title: '10. Children\'s Privacy',
    content: [
      'Our services are not intended for children under the age of 13.',
      'We do not knowingly collect personal information from children under 13.',
      'If we become aware that we have collected information from a child under 13, we will delete it promptly.',
      'Parents or guardians who believe their child has provided personal information should contact us immediately.',
      'For users between 13 and 18, parental consent may be required for certain activities.'
    ]
  },
  {
    id: 'international-transfers',
    title: '11. International Data Transfers',
    content: [
      'Your information may be transferred to and processed in countries other than your own.',
      'We ensure appropriate safeguards are in place for international transfers.',
      'We comply with applicable data protection laws regarding cross-border transfers.',
      'By using our services, you consent to the transfer of your information as described.',
      'We take steps to ensure your information receives adequate protection in all jurisdictions.'
    ]
  },
  {
    id: 'california-privacy',
    title: '12. California Privacy Rights (CCPA)',
    content: [
      'California residents have additional rights under the California Consumer Privacy Act (CCPA).',
      'Right to Know: You can request information about the categories and specific pieces of personal information we collect.',
      'Right to Delete: You can request deletion of your personal information.',
      'Right to Opt-Out: You can opt-out of the sale of personal information (we do not sell personal information).',
      'Right to Non-Discrimination: We will not discriminate against you for exercising your privacy rights.',
      'To exercise these rights, please contact us using the information provided below.'
    ]
  },
  {
    id: 'gdpr-rights',
    title: '13. European Privacy Rights (GDPR)',
    content: [
      'If you are in the European Economic Area (EEA), you have additional rights under the GDPR.',
      'Legal Basis: We process your information based on consent, contract performance, or legitimate interests.',
      'Right to Withdraw Consent: You can withdraw consent for processing based on consent.',
      'Right to Object: You can object to processing based on legitimate interests.',
      'Right to Restrict Processing: You can request restriction of processing in certain circumstances.',
      'Data Protection Officer: You can contact our Data Protection Officer for GDPR-related inquiries.'
    ]
  },
  {
    id: 'policy-updates',
    title: '14. Policy Updates',
    content: [
      'We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements.',
      'We will notify you of material changes by posting the updated policy on our website.',
      'For significant changes, we may provide additional notice via email or prominent website notice.',
      'The "Last Updated" date at the top of this policy indicates when it was last revised.',
      'Your continued use of our services after changes constitutes acceptance of the updated policy.'
    ]
  },
  {
    id: 'contact-us',
    title: '15. Contact Us',
    content: [
      'If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:',
      'Email: privacy@elanorraliving.in',
      'Phone: +91 9876543210',
      'Address: Mumbai, Maharashtra, India',
      'Data Protection Officer: dpo@elanorraliving.in',
      'We will respond to your inquiries within 30 days or as required by applicable law.'
    ]
  }
];

const privacyHighlights = [
  {
    icon: ShieldCheckIcon,
    title: 'Data Protection',
    description: 'We use industry-standard security measures to protect your personal information.'
  },
  {
    icon: EyeIcon,
    title: 'Transparency',
    description: 'We are transparent about what data we collect and how we use it.'
  },
  {
    icon: LockClosedIcon,
    title: 'Your Control',
    description: 'You have control over your data and can exercise your privacy rights at any time.'
  }
];

export default function PrivacyPolicy() {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const expandAll = () => {
    setExpandedSections(privacyData.map(section => section.id));
  };

  const collapseAll = () => {
    setExpandedSections([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
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

        {/* Privacy Highlights */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {privacyHighlights.map((highlight, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6 text-center">
              <highlight.icon className="h-12 w-12 text-rose-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{highlight.title}</h3>
              <p className="text-gray-600">{highlight.description}</p>
            </div>
          ))}
        </div>

        {/* Introduction */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <p className="text-gray-700 leading-relaxed">
            At Elanorra Living, we respect your privacy and are committed to protecting your personal information. 
            This Privacy Policy describes how we collect, use, and safeguard your information when you use our 
            website and services. We believe in transparency and want you to understand your rights and how your 
            information is handled.
          </p>
        </div>

        {/* Privacy Sections */}
        <div className="space-y-4">
          {privacyData.map((section) => {
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

        {/* Data Rights Section */}
        <div className="mt-12 bg-rose-50 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Exercise Your Data Rights</h3>
          <p className="text-gray-700 mb-6">
            You have the right to access, correct, or delete your personal information. 
            Contact us to exercise your privacy rights or if you have any questions about our data practices.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              href="mailto:privacy@elanorraliving.in" 
              className="inline-flex items-center justify-center px-6 py-3 bg-rose-600 text-white font-medium rounded-lg hover:bg-rose-700 transition-colors"
            >
              Contact Privacy Team
            </Link>
            <Link 
              href="/contact" 
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-rose-600 font-medium rounded-lg border border-rose-600 hover:bg-rose-50 transition-colors"
            >
              General Contact
            </Link>
          </div>
        </div>

        {/* Related Links */}
        <div className="mt-8 text-center">
          <div className="flex justify-center space-x-6 text-sm">
            <Link href="/legal/terms" className="text-rose-600 hover:text-rose-700">
              Terms of Service
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