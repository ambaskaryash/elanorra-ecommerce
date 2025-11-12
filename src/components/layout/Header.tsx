'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence, cubicBezier } from 'framer-motion';
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
import SearchBar from '@/components/ui/SearchBar';
import { useUser, useClerk } from '@clerk/nextjs';

interface HeaderProps {
  className?: string;
}

export default function Header({ className }: HeaderProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
  const { totalItems, items, subtotalPrice, totalPrice, toggleCart } = useCartStore();
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const isAuthenticated = isSignedIn;
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const miniCartRef = useRef<HTMLDivElement | null>(null);

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

  // Close mini cart on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (miniCartRef.current && !miniCartRef.current.contains(event.target as Node)) {
        setIsMiniCartOpen(false);
      }
    };
    if (isMiniCartOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMiniCartOpen]);

  // Create navigation structure from database collections
  const navigationItems = [
    {
      id: '1',
      name: 'Shop',
      href: '/shop',
      children: [
        {
          id: '1-1',
          name: 'Tableware',
          href: '/shop?category=tableware',
          children: [
            { id: '1-1-1', name: 'Dinner Sets', href: '/shop?category=tableware&subcategory=dinner-sets' },
            { id: '1-1-2', name: 'Tea & Coffee', href: '/shop?category=tableware&subcategory=tea-coffee' },
            { id: '1-1-3', name: 'Serving', href: '/shop?category=tableware&subcategory=serving' },
            { id: '1-1-4', name: 'Kids Sets', href: '/shop?category=tableware&subcategory=kids-sets' },
          ],
        },
        {
          id: '1-2',
          name: 'Collections',
          href: '/collections',
          children: collections.slice(0, 8).map((collection, index) => ({
            id: `1-2-${index + 1}`,
            name: collection.name,
            href: `/collections/${collection.slug}`,
          })),
        },
        {
          id: '1-3',
          name: 'Stationery',
          href: '/shop?category=stationery',
          children: [
            { id: '1-3-1', name: 'Notebooks', href: '/shop?category=stationery&subcategory=notebooks' },
            { id: '1-3-2', name: 'Art Supplies', href: '/shop?category=stationery&subcategory=art-supplies' },
          ],
        },
        {
          id: '1-4',
          name: 'Gifting',
          href: '/shop?category=gifting',
          children: [
            { id: '1-4-1', name: 'Gift Hampers', href: '/shop?category=gifting&subcategory=hampers' },
            { id: '1-4-2', name: 'Gift Cards', href: '/gift-cards' },
          ],
        },
      ],
    },
    { id: '2', name: 'Our Story', href: '/about' },
    { id: '3', name: 'Blog', href: '/blog' },
    { id: '4', name: 'Contact', href: '/contact' },
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
    <header className={`sticky top-0 z-50 glass ${className || ''}`}>
      {/* Newsletter Banner */}
      <div className="bg-[var(--muted)] text-center py-2 text-sm sm:text-base text-gray-700">
        <span className="font-medium">✨ Welcome to ElanorraLiving</span>
        <span className="mx-2 text-gray-500">•</span>
        <span>Subscribe & get 15% off your first order</span>
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

          {/* Brand Logo + Wordmark */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center" aria-label="ElanorraLiving Home">
              <Image
                src="/icons/elanorra-emblem.svg"
                alt="Elanorra EL emblem"
                width={40}
                height={40}
                priority
                className="mr-2"
              />
              <div className="text-lg sm:text-xl font-serif tracking-widest text-gray-900 flex items-baseline">
                <span className="uppercase">Elanorra</span>
                <span className="ml-1 font-serif normal-case tracking-normal text-gray-700">Living</span>
              </div>
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
                      className={`nav-link whitespace-nowrap ${pathname.startsWith(item.href) ? 'nav-link--active' : ''}`}
                    >
                      {item.name}
                      <ChevronDownIcon className="ml-1 h-4 w-4 text-current" />
                    </button>
                    
                    <AnimatePresence>
                      {activeDropdown === item.id && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.3, ease: cubicBezier(0.16, 1, 0.3, 1) }}
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
                                      <span className="w-2 h-2 bg-[var(--accent)] rounded-full mr-3"></span>
                                      Tableware
                                    </h3>
                                    <div className="space-y-3">
                                      {item.children.find(child => child.name === 'Tableware')?.children?.map((subItem) => (
                                        <Link
                                          key={subItem.id}
                                          href={subItem.href}
                                          className="block text-sm text-gray-600 hover:text-[var(--ring)] hover:translate-x-1 transition-all duration-200 py-1"
                                          onClick={closeAllDropdowns}
                                        >
                                          {subItem.name}
                                        </Link>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  {/* Featured Image */}
                                  <div className="relative h-32 bg-gradient-to-br from-[var(--muted)] to-white rounded-lg overflow-hidden group cursor-pointer">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[color:rgba(138,106,63,0.15)] to-[color:rgba(255,255,255,0.2)] group-hover:from-[color:rgba(138,106,63,0.25)] group-hover:to-[color:rgba(255,255,255,0.25)] transition-all duration-300"></div>
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
                                          className="block text-sm text-gray-600 hover:text-[var(--ring)] hover:translate-x-1 transition-all duration-200 py-1"
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
                                    className="inline-flex items-center text-sm font-medium text-[var(--ring)] hover:text-[var(--accent)] group"
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
                                          className="block text-sm text-gray-600 hover:text-[var(--ring)] hover:translate-x-1 transition-all duration-200 py-1"
                                          onClick={closeAllDropdowns}
                                        >
                                          {subItem.name}
                                        </Link>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  {/* Special Offer Badge */}
                                  <div className="bg-gradient-to-r from-[var(--accent)] to-[color:rgb(186, 156, 109)] text-white p-4 rounded-lg text-center">
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
                    className={`nav-link whitespace-nowrap ${pathname.startsWith(item.href) ? 'nav-link--active' : ''}`}
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
                    <div className="w-8 h-8 bg-[var(--accent)] text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase()}
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
                          {user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
                        </p>
                        <p className="text-sm text-gray-500">{user?.emailAddresses?.[0]?.emailAddress}</p>
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
                        onClick={async () => {
                          await signOut();
                          window.location.href = '/';
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
                  href="/sign-in"
                  className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <UserIcon className="h-5 w-5" />
                  <span>Sign In</span>
                </Link>
              )}
            </div>

            {/* Cart with Mini-Dropdown */}
            <div className="relative hidden sm:block" ref={miniCartRef}>
              <button
                onClick={() => setIsMiniCartOpen((prev) => !prev)}
                className="relative p-2 text-gray-700 hover:text-gray-900"
                aria-haspopup="dialog"
                aria-expanded={isMiniCartOpen}
                aria-label="Open mini cart"
              >
                <ShoppingBagIcon className="h-6 w-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[var(--accent)] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isMiniCartOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.18, ease: cubicBezier(0.16, 1, 0.3, 1) }}
                    className="absolute right-0 mt-2 w-[360px] bg-white/90 backdrop-blur-md border border-gray-200 rounded-xl shadow-2xl z-50"
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-900">Your Cart</h4>
                        {totalItems > 0 && (
                          <span className="text-xs text-gray-500">{totalItems} item{totalItems > 1 ? 's' : ''}</span>
                        )}
                      </div>

                      <div className="mt-3 divide-y divide-gray-100 max-h-64 overflow-auto">
                        {items.length === 0 ? (
                          <div className="py-8 text-center text-sm text-gray-500">Your cart is empty</div>
                        ) : (
                          items.slice(0, 4).map((item) => (
                            <div key={item.productId} className="py-3 flex items-center gap-3">
                              <div className="h-14 w-14 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
                                <Image
                                  src={item.product.images[0]?.src || '/images/placeholder.svg'}
                                  alt={item.product.name}
                                  width={56}
                                  height={56}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                                <p className="text-xs text-gray-500">Qty {item.quantity}</p>
                              </div>
                              <div className="text-sm font-semibold text-gray-900">
                                ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {items.length > 4 && (
                        <div className="mt-2 text-xs text-gray-500">+ {items.length - 4} more item{items.length - 4 > 1 ? 's' : ''}</div>
                      )}

                      <div className="mt-4 border-t border-gray-100 pt-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-semibold text-gray-900">₹{subtotalPrice.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Estimated Total</span>
                          <span className="font-semibold text-gray-900">₹{totalPrice.toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setIsMiniCartOpen(false);
                            toggleCart();
                          }}
                          className="px-3 py-2 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          View Cart
                        </button>
                        <Link
                          href="/checkout"
                          onClick={() => setIsMiniCartOpen(false)}
                          className="px-3 py-2 text-sm font-medium bg-rose-600 text-white rounded-md hover:bg-rose-700 text-center"
                        >
                          Checkout
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Cart button for mobile (opens full cart) */}
            <button 
              onClick={toggleCart}
              className="relative p-2 text-gray-700 hover:text-gray-900 sm:hidden"
            >
              <ShoppingBagIcon className="h-6 w-6" />
              {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-[var(--accent)] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
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
                          className={`h-4 w-4 transition-transform ${activeDropdown === item.id ? 'rotate-180' : ''}`}
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