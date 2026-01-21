'use client';

import ProductCard from '@/components/ui/ProductCard';
import type { ApiProduct } from '@/lib/services/api';
import { capitalizeFirst } from '@/lib/utils/index';
import { FunnelIcon } from '@heroicons/react/24/outline';
import { cubicBezier, motion, Variants } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import SearchBar from '@/components/ui/SearchBar';
import { useDebounce } from 'use-debounce';

const sortOptions = [
  { name: 'Relevance', value: 'relevance' },
  { name: 'Price: Low to High', value: 'price-asc' },
  { name: 'Price: High to Low', value: 'price-desc' },
  { name: 'Newest', value: 'newest' },
  { name: 'Best Selling', value: 'bestselling' },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: cubicBezier(0.16, 1, 0.3, 1),
    },
  },
};

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(query);
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [didYouMean, setDidYouMean] = useState<string | null>(null);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [debouncedPriceRange] = useDebounce(priceRange, 500);

  // Removed auto-update of priceRange from products to avoid loops with server-side filtering

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedSearchQuery.length > 1) {
        try {
          const res = await fetch(`/api/products/suggestions?q=${debouncedSearchQuery}`);
          if (res.ok) {
            const data = await res.json();
            setSuggestions(data.suggestions || []);
            setDidYouMean(data.didYouMean || null);
            setIsSuggestionsOpen(true);
          }
        } catch (error) {
          console.error('Failed to fetch suggestions', error);
        }
      } else {
        setSuggestions([]);
        setDidYouMean(null);
        setIsSuggestionsOpen(false);
      }
    };
    fetchSuggestions();
  }, [debouncedSearchQuery]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set('search', query.trim());
        if (selectedCategory !== 'all') params.set('category', selectedCategory);

        // Add price range
        params.set('minPrice', debouncedPriceRange[0].toString());
        params.set('maxPrice', debouncedPriceRange[1].toString());

        // Map sort options to API
        if (sortBy === 'price-asc') {
          params.set('sortBy', 'price');
          params.set('sortOrder', 'asc');
        } else if (sortBy === 'price-desc') {
          params.set('sortBy', 'price');
          params.set('sortOrder', 'desc');
        } else if (sortBy === 'newest') {
          params.set('sortBy', 'createdAt');
          params.set('sortOrder', 'desc');
        } else {
          // relevance or bestselling
          // Note: API doesn't fully support relevance scoring yet, but basic sort is there.
        }

        const res = await fetch(`/api/products?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const apiProducts: ApiProduct[] = data.products || [];
          setProducts(apiProducts);

          // derive categories from fetched products (or ideally separate facet query)
          const map = new Map<string, number>();
          apiProducts.forEach((p) => {
            map.set(p.category, (map.get(p.category) || 0) + 1);
          });
          setCategories(Array.from(map.entries()).map(([name, count]) => ({ id: name, name: capitalizeFirst(name), count })));
        } else {
          setProducts([]);
          setCategories([]);
        }
      } catch (err) {
        console.error('Failed to fetch products', err);
        setProducts([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [query, selectedCategory, sortBy, debouncedPriceRange]);

  // Client-side filtering replaced by server-side
  const searchResults = products;

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?q=${searchQuery}`);
    setIsSuggestionsOpen(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    router.push(`/search?q=${suggestion}`);
    setIsSuggestionsOpen(false);
  };

  return (
    <Suspense fallback={null}>
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
            
            <div className="relative mb-4">
              <SearchBar className="w-full" />
            </div>

            {query ? (
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                  Search Results for &quot;{query}&quot;
                </h1>
                {didYouMean && didYouMean.toLowerCase() !== query.toLowerCase() && (
                  <p className="text-md text-gray-600 mb-2">
                    Did you mean: <Link href={`/search?q=${didYouMean}`} className="text-rose-600 hover:underline">{didYouMean}</Link>?
                  </p>
                )}
                <p className="text-lg text-gray-600">
                  {products.length} {products.length === 1 ? 'product' : 'products'} found
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
                    Range: ₹0 - ₹10,000+
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setPriceRange([0, 10000]);
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
                  Showing {products.length} {products.length === 1 ? 'result' : 'results'}
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
                {loading ? (
                  <div className="col-span-full text-center text-gray-500 py-12">Loading products...</div>
                ) : searchResults.map((product) => (
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
                    Try adjusting your search or filters to find what you&apos;re looking for.
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
    </Suspense>
  );
}

export const dynamic = 'force-dynamic';