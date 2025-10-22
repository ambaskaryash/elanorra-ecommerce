'use client';

import {
  EnvelopeIcon,
  MapPinIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import NewsletterSubscription from '@/components/newsletter/FooterNewsletterSubscription';

const footerLinks = {
  shop: [
    { name: 'Tableware', href: '/shop/tableware' },
    { name: 'Collections', href: '/collections' },
    { name: 'Stationery', href: '/shop/stationery' },
    { name: 'Gift Sets', href: '/shop/gift-sets' },
    { name: 'New Arrivals', href: '/shop?filter=new' },
  ],
  company: [
    { name: 'Our Story', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
    { name: 'Careers', href: '/careers' },
    { name: 'Press', href: '/press' },
  ],
  support: [
    { name: 'FAQ', href: '/faq' },
    { name: 'Shipping & Returns', href: '/shipping-returns' },
    { name: 'Size Guide', href: '/size-guide' },
    { name: 'Care Instructions', href: '/care' },
    { name: 'Track Your Order', href: '/track-order' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Return Policy', href: '/returns' },
    { name: 'Cookie Policy', href: '/cookies' },
  ],
};

const socialLinks = [
  {
    name: 'Instagram',
    href: 'https://instagram.com/yourbrand',
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24" className="h-5 w-5">
        <path
          fillRule="evenodd"
          d="M12.017 0C8.396 0 7.999.01 6.84.048 5.69.087 4.949.222 4.312.42a7.4 7.4 0 0 0-2.687 1.747A7.4 7.4 0 0 0 .378 4.854C.18 5.491.045 6.232.006 7.382.01 8.54 0 8.937 0 12.017s.01 3.476.048 4.634c.039 1.15.174 1.891.372 2.528a7.4 7.4 0 0 0 1.747 2.687 7.4 7.4 0 0 0 2.687 1.747c.637.198 1.378.333 2.528.372C7.999 23.99 8.396 24 12.017 24s4.017-.01 5.176-.048c1.15-.039 1.891-.174 2.528-.372a7.4 7.4 0 0 0 2.687-1.747 7.4 7.4 0 0 0 1.747-2.687c.198-.637.333-1.378.372-2.528.04-1.158.048-1.555.048-4.634s-.008-3.476-.048-4.634c-.039-1.15-.174-1.891-.372-2.528A7.4 7.4 0 0 0 22.408 1.62 7.4 7.4 0 0 0 19.721.873c-.637-.198-1.378-.333-2.528-.372C16.035.01 15.638 0 12.017 0zm0 2.161c3.321 0 3.716.013 4.847.048 1.169.053 1.804.249 2.227.415.56.217.96.477 1.382.899.422.422.682.822.899 1.382.166.423.362 1.058.415 2.227.035 1.131.048 1.526.048 4.847s-.013 3.716-.048 4.847c-.053 1.169-.249 1.804-.415 2.227-.217.56-.477.96-.899 1.382-.422.422-.822.682-1.382.899-.423.166-1.058.362-2.227.415-1.131.035-1.526.048-4.847.048s-3.716-.013-4.847-.048c-1.169-.053-1.804-.249-2.227-.415a3.743 3.743 0 0 1-1.382-.899 3.743 3.743 0 0 1-.899-1.382c-.166-.423-.362-1.058-.415-2.227-.035-1.131-.048-1.526-.048-4.847s.013-3.716.048-4.847c.053-1.169.249-1.804.415-2.227.217-.56.477-.96.899-1.382a3.743 3.743 0 0 1 1.382-.899c.423-.166 1.058-.362 2.227-.415 1.131-.035 1.526-.048 4.847-.048zm0 3.67a6.186 6.186 0 1 0 0 12.372 6.186 6.186 0 0 0 0-12.372zm0 10.21a4.024 4.024 0 1 1 0-8.048 4.024 4.024 0 0 1 0 8.048zm7.846-10.405a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    name: 'Facebook',
    href: 'https://facebook.com/yourbrand',
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24" className="h-5 w-5">
        <path
          fillRule="evenodd"
          d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    name: 'Twitter',
    href: 'https://twitter.com/yourbrand',
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24" className="h-5 w-5">
        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newsletter Signup */}
        <div className="border-b border-gray-800 py-12">
          <div className="max-w-2xl mx-auto">
            <NewsletterSubscription />
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <Link href="/" className="text-2xl font-bold">
                ElanorraLiving
              </Link>
              <p className="text-gray-300 mt-4 max-w-sm">
                Transform your space with our curated collection of premium home decor and lifestyle products. 
                Elevate your everyday living experience.
              </p>
            </div>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <EnvelopeIcon className="h-5 w-5 text-rose-500" />
                <span className="text-gray-300">hello@elanorraliving.in</span>
              </div>
              <div className="flex items-center space-x-3">
                <PhoneIcon className="h-5 w-5 text-rose-500" />
                <span className="text-gray-300">+91 9876543210</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPinIcon className="h-5 w-5 text-rose-500" />
                <span className="text-gray-300">Mumbai, Maharashtra, India</span>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Shop</h4>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href} 
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-6">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href} 
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-6">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href} 
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-800 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Social Media */}
            <div className="flex items-center space-x-6">
              <span className="text-gray-300">Follow us:</span>
              {socialLinks.map((social) => (
                <Link
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <span className="sr-only">{social.name}</span>
                  {social.icon}
                </Link>
              ))}
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap items-center space-x-6 text-sm">
              {footerLinks.legal.map((link, index) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-6 pt-6 border-t border-gray-800 text-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} ElanorraLiving. All rights reserved. Crafted with ❤ for luxury living.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
