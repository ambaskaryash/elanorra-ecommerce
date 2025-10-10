'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FunnelIcon } from '@heroicons/react/24/outline';
import ProductCard from '@/components/ui/ProductCard';
import { products, categories } from '@/lib/data/mock-data';
import { capitalizeFirst } from '@/lib/utils';

const sortOptions = [
  { name: 'Relevance', value: 'relevance' },
  { name: 'Price: Low to High', value: 'price-asc' },
  { name: 'Price: High to Low', value: 'price-desc' },
  { name: 'Newest', value: 'newest' },
  { name: 'Best Selling', value: 'bestselling' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);

  // Calculate actual price range from products
  const actualPriceRange = useMemo(() => {
    const prices = products.map(p => p.price);
    return [Math.min(...prices), Math.max(...prices)] as [number, number];
  }, []);

  useEffect(() => {
    setPriceRange(actualPriceRange);
  }, [actualPriceRange]);

  const searchResults = useMemo(() => {
    let filtered = products;

    // Text search
    if (query.trim()) {
      const searchTerm = query.toLowerCase().trim();
      filtered = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
        (product.shortDescription && product.shortDescription.toLowerCase().includes(searchTerm))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Filter by price range
    filtered = filtered.filter(product => 
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    // Sort products
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'newest':
          return a.newArrival ? -1 : b.newArrival ? 1 : 0;
        case 'bestselling':
          return a.bestseller ? -1 : b.bestseller ? 1 : 0;
        case 'relevance':
        default:
          // Simple relevance scoring based on name match
          if (query.trim()) {
            const searchTerm = query.toLowerCase().trim();
            const aScore = a.name.toLowerCase().includes(searchTerm) ? 2 : 
                          a.description.toLowerCase().includes(searchTerm) ? 1 : 0;
            const bScore = b.name.toLowerCase().includes(searchTerm) ? 2 : 
                          b.description.toLowerCase().includes(searchTerm) ? 1 : 0;
            return bScore - aScore;
          }
          return a.featured ? -1 : b.featured ? 1 : 0;
      }
    });

    return sorted;
  }, [query, selectedCategory, priceRange, sortBy]);

  const handlePriceRangeChange = (index: number, value: string) => {
    const numValue = parseInt(value) || 0;
    const newRange: [number, number] = [...priceRange];
    newRange[index] = numValue;
    
    // Ensure min <= max
    if (index === 0 && numValue > newRange[1]) {
      newRange[1] = numValue;
    } else if (index === 1 && numValue < newRange[0]) {
      newRange[0] = numValue;
    }
    
    setPriceRange(newRange);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <nav className="flex mb-4">
              <ol className="flex items-center space-x-2 text-sm text-gray-500">
                <li><Link href="/" className="hover:text-gray-700">Home</Link></li>
                <li>/</li>
                <li className="text-gray-900 font-medium">Search Results</li>
              </ol>
            </nav>
            
            {query ? (
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                  Search Results for "{query}"
                </h1>
                <p className="text-lg text-gray-600">
                  {searchResults.length} {searchResults.length === 1 ? 'product' : 'products'} found
                </p>
              </div>
            ) : (
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                  All Products
                </h1>
                <p className="text-lg text-gray-600">
                  Browse our complete collection of handcrafted products
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className={`lg:w-64 ${isFilterOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
              {/* Categories */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`block w-full text-left px-3 py-2 rounded-md transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-rose-100 text-rose-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    All Categories ({products.length})
                  </button>
                  {categories.map((category) => {
                    const count = products.filter(p => p.category === category.id).length;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`block w-full text-left px-3 py-2 rounded-md transition-colors ${
                          selectedCategory === category.id
                            ? 'bg-rose-100 text-rose-700'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        {capitalizeFirst(category.name)} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Range</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange[0]}
                      onChange={(e) => handlePriceRangeChange(0, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceRange[1]}
                      onChange={(e) => handlePriceRangeChange(1, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    Range: ₹{actualPriceRange[0].toLocaleString()} - ₹{actualPriceRange[1].toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setPriceRange(actualPriceRange);
                  setSortBy('relevance');
                }}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
              >
                Clear All Filters
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="lg:hidden flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <FunnelIcon className="h-5 w-5" />
                  <span>Filters</span>
                </button>
                <p className="text-gray-600">
                  Showing {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
                  {query && ` for "${query}"`}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <label htmlFor="sort" className="text-sm font-medium text-gray-700">
                  Sort by:
                </label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results */}
            {searchResults.length > 0 ? (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {searchResults.map((product) => (
                  <motion.div key={product.id} variants={itemVariants}>
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4 text-lg">
                  {query ? `No products found for "${query}"` : 'No products found'}
                </div>
                <div className="space-y-4">
                  <p className="text-gray-400">
                    Try adjusting your search or filters to find what you're looking for.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    {query && (
                      <Link
                        href="/search"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        View All Products
                      </Link>
                    )}
                    <Link
                      href="/shop"
                      className="inline-flex items-center px-6 py-2 bg-rose-600 text-white font-medium rounded-md hover:bg-rose-700 transition-colors"
                    >
                      Browse Shop
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}