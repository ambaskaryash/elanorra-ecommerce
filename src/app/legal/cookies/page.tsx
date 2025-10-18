'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDownIcon, ChevronUpIcon, CogIcon, ChartBarIcon, GlobeAltIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

interface CookieType {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  examples: string[];
  required: boolean;
}

interface Section {
  id: string;
  title: string;
  content: string[];
}

const cookieTypes: CookieType[] = [
  {
    id: 'essential',
    name: 'Essential Cookies',
    icon: ShieldCheckIcon,
    description: 'These cookies are necessary for the website to function properly and cannot be disabled.',
    examples: [
      'Authentication and session management',
      'Shopping cart functionality',
      'Security and fraud prevention',
      'Load balancing and performance'
    ],
    required: true
  },
  {
    id: 'functional',
    name: 'Functional Cookies',
    icon: CogIcon,
    description: 'These cookies enhance your experience by remembering your preferences and settings.',
    examples: [
      'Language and region preferences',
      'Theme and display settings',
      'Recently viewed products',
      'Saved search filters'
    ],
    required: false
  },
  {
    id: 'analytics',
    name: 'Analytics Cookies',
    icon: ChartBarIcon,
    description: 'These cookies help us understand how visitors interact with our website.',
    examples: [
      'Google Analytics tracking',
      'Page view statistics',
      'User behavior analysis',
      'Performance monitoring'
    ],
    required: false
  },
  {
    id: 'marketing',
    name: 'Marketing Cookies',
    icon: GlobeAltIcon,
    description: 'These cookies are used to deliver relevant advertisements and track campaign effectiveness.',
    examples: [
      'Targeted advertising',
      'Social media integration',
      'Email campaign tracking',
      'Retargeting pixels'
    ],
    required: false
  }
];

const cookiePolicyData: Section[] = [
  {
    id: 'what-are-cookies',
    title: '1. What Are Cookies?',
    content: [
      'Cookies are small text files that are stored on your device when you visit a website.',
      'They contain information that helps websites remember your preferences and improve your browsing experience.',
      'Cookies can be "session cookies" (deleted when you close your browser) or "persistent cookies" (remain on your device for a set period).',
      'Most websites use cookies to provide personalized experiences and analyze website performance.'
    ]
  },
  {
    id: 'how-we-use-cookies',
    title: '2. How We Use Cookies',
    content: [
      'We use cookies to provide essential website functionality and enhance your shopping experience.',
      'Cookies help us remember your login status, shopping cart contents, and preferences.',
      'We analyze website usage patterns to improve our products and services.',
      'Marketing cookies help us show you relevant products and offers.',
      'All cookie usage complies with applicable privacy laws and regulations.'
    ]
  },
  {
    id: 'cookie-consent',
    title: '3. Cookie Consent',
    content: [
      'When you first visit our website, we will ask for your consent to use non-essential cookies.',
      'You can choose which types of cookies to accept through our cookie consent banner.',
      'Essential cookies are automatically enabled as they are necessary for website functionality.',
      'You can change your cookie preferences at any time through our cookie settings.',
      'Withdrawing consent will not affect the lawfulness of processing based on consent before withdrawal.'
    ]
  },
  {
    id: 'third-party-cookies',
    title: '4. Third-Party Cookies',
    content: [
      'Some cookies on our website are set by third-party services we use.',
      'Google Analytics: Helps us understand website usage and improve user experience.',
      'Payment Processors: Enable secure payment processing for your orders.',
      'Social Media Platforms: Allow you to share content and see social media integration.',
      'Advertising Partners: Help us show relevant ads on other websites you visit.',
      'Each third party has their own privacy policy governing their use of cookies.'
    ]
  },
  {
    id: 'managing-cookies',
    title: '5. Managing Your Cookie Preferences',
    content: [
      'You can control cookies through your browser settings and our cookie preference center.',
      'Most browsers allow you to block or delete cookies, though this may affect website functionality.',
      'You can opt-out of Google Analytics tracking by installing the Google Analytics Opt-out Browser Add-on.',
      'For advertising cookies, you can visit the Digital Advertising Alliance opt-out page.',
      'Mobile users can adjust cookie settings through their device\'s privacy settings.'
    ]
  },
  {
    id: 'cookie-retention',
    title: '6. Cookie Retention',
    content: [
      'Session cookies are automatically deleted when you close your browser.',
      'Persistent cookies remain on your device for varying periods depending on their purpose.',
      'Essential cookies typically last for the duration of your session or up to 30 days.',
      'Analytics cookies may be retained for up to 2 years to analyze long-term trends.',
      'Marketing cookies are usually retained for 30-90 days for campaign effectiveness.',
      'You can delete cookies manually through your browser settings at any time.'
    ]
  },
  {
    id: 'updates-to-policy',
    title: '7. Updates to This Policy',
    content: [
      'We may update this Cookie Policy from time to time to reflect changes in our practices.',
      'Material changes will be communicated through our website or via email.',
      'The "Last Updated" date indicates when the policy was last revised.',
      'Continued use of our website after changes constitutes acceptance of the updated policy.',
      'We encourage you to review this policy periodically for any updates.'
    ]
  }
];

export default function CookiePolicy() {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [cookiePreferences, setCookiePreferences] = useState({
    essential: true,
    functional: true,
    analytics: true,
    marketing: false
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const expandAll = () => {
    setExpandedSections(cookiePolicyData.map(section => section.id));
  };

  const collapseAll = () => {
    setExpandedSections([]);
  };

  const handleCookiePreferenceChange = (cookieId: string, enabled: boolean) => {
    if (cookieId === 'essential') return; // Essential cookies cannot be disabled
    
    setCookiePreferences(prev => ({
      ...prev,
      [cookieId]: enabled
    }));
  };

  const savePreferences = () => {
    // In a real implementation, you would save these preferences to localStorage
    // and apply them to your cookie management system
    localStorage.setItem('cookiePreferences', JSON.stringify(cookiePreferences));
    alert('Cookie preferences saved successfully!');
  };

  const acceptAll = () => {
    const allAccepted = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true
    };
    setCookiePreferences(allAccepted);
    localStorage.setItem('cookiePreferences', JSON.stringify(allAccepted));
    alert('All cookies accepted!');
  };

  const rejectAll = () => {
    const essentialOnly = {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false
    };
    setCookiePreferences(essentialOnly);
    localStorage.setItem('cookiePreferences', JSON.stringify(essentialOnly));
    alert('Only essential cookies will be used.');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
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

        {/* Cookie Types Overview */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Types of Cookies We Use</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {cookieTypes.map((cookieType) => (
              <div key={cookieType.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <cookieType.icon className="h-8 w-8 text-rose-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">{cookieType.name}</h3>
                  {cookieType.required && (
                    <span className="ml-2 px-2 py-1 bg-rose-100 text-rose-800 text-xs font-medium rounded">
                      Required
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mb-4">{cookieType.description}</p>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Examples:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {cookieType.examples.map((example, index) => (
                      <li key={index} className="flex items-center">
                        <span className="w-1.5 h-1.5 bg-rose-600 rounded-full mr-2"></span>
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cookie Preferences */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Manage Your Cookie Preferences</h2>
          <div className="space-y-6">
            {cookieTypes.map((cookieType) => (
              <div key={cookieType.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <cookieType.icon className="h-5 w-5 text-rose-600 mr-2" />
                    <h3 className="font-semibold text-gray-900">{cookieType.name}</h3>
                    {cookieType.required && (
                      <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                        Always Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{cookieType.description}</p>
                </div>
                <div className="ml-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cookiePreferences[cookieType.id as keyof typeof cookiePreferences]}
                      onChange={(e) => handleCookiePreferenceChange(cookieType.id, e.target.checked)}
                      disabled={cookieType.required}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                  </label>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button
              onClick={acceptAll}
              className="px-6 py-3 bg-rose-600 text-white font-medium rounded-lg hover:bg-rose-700 transition-colors"
            >
              Accept All Cookies
            </button>
            <button
              onClick={savePreferences}
              className="px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
            >
              Save Preferences
            </button>
            <button
              onClick={rejectAll}
              className="px-6 py-3 bg-white text-gray-600 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Reject All (Essential Only)
            </button>
          </div>
        </div>

        {/* Policy Sections */}
        <div className="space-y-4 mb-12">
          {cookiePolicyData.map((section) => {
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

        {/* Contact Section */}
        <div className="bg-rose-50 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Questions About Cookies?</h3>
          <p className="text-gray-700 mb-6">
            If you have any questions about our use of cookies or this Cookie Policy, please don't hesitate to contact us.
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
            <Link href="/legal/terms" className="text-rose-600 hover:text-rose-700">
              Terms of Service
            </Link>
            <Link href="/legal/privacy" className="text-rose-600 hover:text-rose-700">
              Privacy Policy
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