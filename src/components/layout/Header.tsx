'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  ShoppingBagIcon, 
  UserIcon, 
  Bars3Icon, 
  XMarkIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { useCartStore } from '@/lib/store/cart-store';
// Dynamic navigation will be created from database collections
import { cn } from '@/lib/utils';
import SearchBar from '@/components/ui/SearchBar';
import { useSession, signOut } from 'next-auth/react';

interface HeaderProps {
  className?: string;
}

export default function Header({ className }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
  const { totalItems, toggleCart } = useCartStore();
  const { data: session, status } = useSession();
  const user = session?.user;
  const isAuthenticated = !!session;
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch collections for navigation
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await fetch('/api/collections');
        if (response.ok) {
          const data = await response.json();
          setCollections(data.collections || []);
        }
      } catch (error) {
        console.error('Failed to fetch collections:', error);
      }
    };
    
    fetchCollections();
  }, []);

  // Create navigation structure from database collections
  const navigationItems = [
    { id: '1', name: 'Home', href: '/' },
    {
      id: '2',
      name: 'Shop',
      href: '/shop',
      children: [
        {
          id: '2-1',
          name: 'Tableware',
          href: '/shop?category=tableware',
          children: [
            { id: '2-1-1', name: 'Dinner Sets', href: '/shop?category=tableware&subcategory=dinner-sets' },
            { id: '2-1-2', name: 'Tea & Coffee', href: '/shop?category=tableware&subcategory=tea-coffee' },
            { id: '2-1-3', name: 'Serving', href: '/shop?category=tableware&subcategory=serving' },
            { id: '2-1-4', name: 'Kids Sets', href: '/shop?category=tableware&subcategory=kids-sets' },
          ],
        },
        {
          id: '2-2',
          name: 'Collections',
          href: '/collections',
          children: collections.slice(0, 8).map((collection, index) => ({
            id: `2-2-${index + 1}`,
            name: collection.name,
            href: `/collections/${collection.slug}`,
          })),
        },
        {
          id: '2-3',
          name: 'Stationery',
          href: '/shop?category=stationery',
          children: [
            { id: '2-3-1', name: 'Notebooks', href: '/shop?category=stationery&subcategory=notebooks' },
            { id: '2-3-2', name: 'Art Supplies', href: '/shop?category=stationery&subcategory=art-supplies' },
          ],
        },
        {
          id: '2-4',
          name: 'Gifting',
          href: '/shop?category=gifting',
          children: [
            { id: '2-4-1', name: 'Gift Hampers', href: '/shop?category=gifting&subcategory=hampers' },
            { id: '2-4-2', name: 'Gift Cards', href: '/gift-cards' },
          ],
        },
      ],
    },
    { id: '3', name: 'Our Story', href: '/about' },
    { id: '4', name: 'Services', href: '/services' },
    { id: '5', name: 'Contact', href: '/contact' },
  ];

  const handleDropdownToggle = (itemId: string) => {
    setActiveDropdown(activeDropdown === itemId ? null : itemId);
  };

  const handleMouseEnter = (itemId: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setActiveDropdown(itemId);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150); // Small delay to prevent flickering
  };

  const closeAllDropdowns = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setActiveDropdown(null);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <header className={cn('bg-white border-b border-gray-200 sticky top-0 z-50', className)}>
      {/* Newsletter Banner */}
      <div className="bg-rose-50 text-center py-2 text-sm text-gray-700">
        <span>✨ Welcome to Elanorraa Living - Subscribe & Get 15% OFF Your First Order!</span>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:text-gray-900"
            >
              {isMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          </div>

          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-gray-900 tracking-wide">
              Elanorraa Living
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {navigationItems.map((item) => (
              <div key={item.id} className="relative group">
                {item.children ? (
                  <div
                    onMouseEnter={() => handleMouseEnter(item.id)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <button
                      onClick={() => handleDropdownToggle(item.id)}
                      className="flex items-center text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap"
                    >
                      {item.name}
                      <ChevronDownIcon className="ml-1 h-4 w-4" />
                    </button>
                    
                    <AnimatePresence>
                      {activeDropdown === item.id && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                          className={`absolute left-0 mt-3 bg-white shadow-2xl border border-gray-100 z-50 ${
                            item.name === 'Shop' 
                              ? 'w-[95vw] max-w-4xl xl:max-w-6xl rounded-2xl' 
                              : 'w-64 rounded-lg'
                          }`}
                        >
                          {item.name === 'Shop' ? (
                            // Mega Menu for Shop
                            <div className="p-8">
                              <div className="grid grid-cols-3 gap-8">
                                {/* Left Column - Tableware */}
                                <div>
                                  <div className="mb-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                      <span className="w-2 h-2 bg-rose-500 rounded-full mr-3"></span>
                                      Tableware
                                    </h3>
                                    <div className="space-y-3">
                                      {item.children.find(child => child.name === 'Tableware')?.children?.map((subItem) => (
                                        <Link
                                          key={subItem.id}
                                          href={subItem.href}
                                          className="block text-sm text-gray-600 hover:text-rose-600 hover:translate-x-1 transition-all duration-200 py-1"
                                          onClick={closeAllDropdowns}
                                        >
                                          {subItem.name}
                                        </Link>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  {/* Featured Image */}
                                  <div className="relative h-32 bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg overflow-hidden group cursor-pointer">
                                    <div className="absolute inset-0 bg-gradient-to-br from-rose-400/20 to-pink-400/20 group-hover:from-rose-400/30 group-hover:to-pink-400/30 transition-all duration-300"></div>
                                    <div className="absolute bottom-3 left-3 right-3">
                                      <p className="text-xs font-medium text-gray-700 mb-1">Elevate Your Everyday</p>
                                      <p className="text-xs text-gray-500">Premium Home Decor</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Middle Column - Collections */}
                                <div>
                                  <div className="mb-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                      <span className="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>
                                      Collections
                                    </h3>
                                    <div className="space-y-3">
                                      {item.children.find(child => child.name === 'Collections')?.children?.slice(0, 6).map((subItem) => (
                                        <Link
                                          key={subItem.id}
                                          href={subItem.href}
                                          className="block text-sm text-gray-600 hover:text-rose-600 hover:translate-x-1 transition-all duration-200 py-1"
                                          onClick={closeAllDropdowns}
                                        >
                                          {subItem.name}
                                        </Link>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  {/* View All Collections Link */}
                                  <Link
                                    href="/collections"
                                    className="inline-flex items-center text-sm font-medium text-rose-600 hover:text-rose-700 group"
                                    onClick={closeAllDropdowns}
                                  >
                                    View All Collections
                                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </Link>
                                </div>

                                {/* Right Column - Other Categories & Featured */}
                                <div>
                                  <div className="mb-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                      <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></span>
                                      More
                                    </h3>
                                    <div className="space-y-3">
                                      {item.children.filter(child => !['Tableware', 'Collections'].includes(child.name)).map((subItem) => (
                                        <Link
                                          key={subItem.id}
                                          href={subItem.href}
                                          className="block text-sm text-gray-600 hover:text-rose-600 hover:translate-x-1 transition-all duration-200 py-1"
                                          onClick={closeAllDropdowns}
                                        >
                                          {subItem.name}
                                        </Link>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  {/* Special Offer Badge */}
                                  <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white p-4 rounded-lg text-center">
                                    <p className="text-xs font-medium mb-1">New Customer?</p>
                                    <p className="text-sm font-bold mb-2">Get 15% OFF</p>
                                    <p className="text-xs opacity-90">on your first order</p>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Bottom CTA */}
                              <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">Discover Our Story</p>
                                  <p className="text-xs text-gray-500">Curated luxury living experiences</p>
                                </div>
                                <Link
                                  href="/about"
                                  className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
                                  onClick={closeAllDropdowns}
                                >
                                  Learn More
                                </Link>
                              </div>
                            </div>
                          ) : (
                            // Regular dropdown for other items
                            <div className="py-2">
                              {item.children.map((subItem) => (
                                <div key={subItem.id}>
                                  {subItem.children ? (
                                    <div>
                                      <div className="px-4 py-2 text-sm font-medium text-gray-900 bg-gray-50">
                                        {subItem.name}
                                      </div>
                                      {subItem.children.map((subSubItem) => (
                                        <Link
                                          key={subSubItem.id}
                                          href={subSubItem.href}
                                          className="block px-6 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                          onClick={closeAllDropdowns}
                                        >
                                          {subSubItem.name}
                                        </Link>
                                      ))}
                                    </div>
                                  ) : (
                                    <Link
                                      href={subItem.href}
                                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                      onClick={closeAllDropdowns}
                                    >
                                      {subItem.name}
                                    </Link>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Right side icons */}
          <div className="flex items-center space-x-4">
            {/* Search - Desktop */}
            <div className="hidden sm:block">
              <SearchBar className="w-80" />
            </div>
            
            {/* Search - Mobile */}
            <div className="sm:hidden">
              {isSearchOpen ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute top-full left-0 right-0 bg-white border-t border-gray-200 p-4 z-50"
                >
                  <SearchBar />
                  <button
                    onClick={() => setIsSearchOpen(false)}
                    className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </motion.div>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 text-gray-700 hover:text-gray-900"
                >
                  <MagnifyingGlassIcon className="h-6 w-6" />
                </button>
              )}
            </div>

            {/* Account */}
            <div className="relative">
              {isAuthenticated ? (
                <div>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-2 text-gray-700 hover:text-gray-900 rounded-md"
                  >
                    <div className="w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {user?.name?.[0] || user?.email?.[0]?.toUpperCase()}
                    </div>
                    <ChevronDownIcon className="h-4 w-4" />
                  </button>
                  
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
                    >
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">
                          {user?.name || `${(user as any)?.firstName} ${(user as any)?.lastName}`}
                        </p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                      </div>
                      <Link
                        href="/account"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setShowUserMenu(false)}
                      >
                        My Account
                      </Link>
                      <Link
                        href="/account/orders"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Orders
                      </Link>
                      <Link
                        href="/account/wishlist"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Wishlist
                      </Link>
                      <button
                        onClick={() => {
                          signOut({ callbackUrl: '/' });
                          setShowUserMenu(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <UserIcon className="h-5 w-5" />
                  <span>Sign In</span>
                </Link>
              )}
            </div>

            {/* Cart */}
            <button 
              onClick={toggleCart}
              className="relative p-2 text-gray-700 hover:text-gray-900"
            >
              <ShoppingBagIcon className="h-6 w-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-200"
          >
            <nav className="px-4 py-4 space-y-2">
              {navigationItems.map((item) => (
                <div key={item.id}>
                  {item.children ? (
                    <div>
                      <button
                        onClick={() => handleDropdownToggle(item.id)}
                        className="flex items-center justify-between w-full text-left px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                      >
                        {item.name}
                        <ChevronDownIcon 
                          className={cn(
                            'h-4 w-4 transition-transform',
                            activeDropdown === item.id && 'rotate-180'
                          )} 
                        />
                      </button>
                      
                      <AnimatePresence>
                        {activeDropdown === item.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="ml-4 mt-2 space-y-1"
                          >
                            {item.children.map((subItem) => (
                              <div key={subItem.id}>
                                {subItem.children ? (
                                  <div>
                                    <div className="px-3 py-2 text-sm font-medium text-gray-900">
                                      {subItem.name}
                                    </div>
                                    <div className="ml-4 space-y-1">
                                      {subItem.children.map((subSubItem) => (
                                        <Link
                                          key={subSubItem.id}
                                          href={subSubItem.href}
                                          className="block px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                                          onClick={() => setIsMenuOpen(false)}
                                        >
                                          {subSubItem.name}
                                        </Link>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <Link
                                    href={subItem.href}
                                    className="block px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                                    onClick={() => setIsMenuOpen(false)}
                                  >
                                    {subItem.name}
                                  </Link>
                                )}
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className="block px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}