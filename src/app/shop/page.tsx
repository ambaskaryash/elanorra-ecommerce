'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FunnelIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import ProductCard from '@/components/ui/ProductCard';
import { ApiProduct } from '@/lib/services/api';
import { useSearchParams } from 'next/navigation';

const sortOptions = [
  { name: 'Featured', value: 'featured' },
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

interface Category {
  id: string;
  name: string;
  count: number;
}

interface PriceRange {
  min: number;
  max: number;
}

export default function ShopPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: 0, max: 50000 });
  const [minRating, setMinRating] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const productsPerPage = 12;

  // Fetch products and categories
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [selectedCategory, sortBy, sortOrder, currentPage, priceRange, minRating]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: productsPerPage.toString(),
        sortBy,
        sortOrder,
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
      });
      
      const response = await fetch(`/api/products?${params}`);
      if (response.ok) {
        const data = await response.json();
        
        // Filter by price range and rating on frontend for now
        let filteredProducts = data.products.filter((product: ApiProduct) => 
          product.price >= priceRange.min && 
          product.price <= priceRange.max &&
          product.avgRating >= minRating
        );
        
        setProducts(filteredProducts);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        
        // Generate categories from products
        const categoryMap = new Map<string, number>();
        data.products.forEach((product: ApiProduct) => {
          categoryMap.set(product.category, (categoryMap.get(product.category) || 0) + 1);
        });
        
        const categoryList: Category[] = Array.from(categoryMap, ([name, count]) => ({
          id: name,
          name: name.charAt(0).toUpperCase() + name.slice(1),
          count,
        }));
        
        setCategories(categoryList);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };
  
  const handleSortChange = (newSortBy: string) => {
    if (newSortBy.includes('-')) {
      const [field, order] = newSortBy.split('-');
      setSortBy(field === 'price' ? 'price' : 'createdAt');
      setSortOrder(order);
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };
  
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };
  
  const handlePriceRangeChange = (min: number, max: number) => {
    setPriceRange({ min, max });
    setCurrentPage(1);
  };
  
  const handleRatingChange = (rating: number) => {
    setMinRating(rating);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Shop All Products
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover our complete collection of handcrafted tableware and stationery, 
              each piece telling its own unique story.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Advanced Sidebar Filters */}
          <div className={`lg:w-64 space-y-6 ${isFilterOpen ? 'block' : 'hidden lg:block'}`}>
            {/* Categories Filter */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleCategoryChange('all')}
                  className={`block w-full text-left px-3 py-2 rounded-md transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-rose-100 text-rose-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  All Products
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(category.id)}
                    className={`block w-full text-left px-3 py-2 rounded-md transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-rose-100 text-rose-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {category.name} ({category.count})
                  </button>
                ))}
              </div>
            </div>
            
            {/* Price Range Filter */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Range</h3>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) || 50000 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div className="flex space-x-2">
                  {[1000, 2500, 5000, 10000].map((price) => (
                    <button
                      key={price}
                      onClick={() => handlePriceRangeChange(0, price)}
                      className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                    >
                      ₹{price}+
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Rating Filter */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Minimum Rating</h3>
              <div className="space-y-2">
                {[4, 3, 2, 1, 0].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleRatingChange(rating)}
                    className={`flex items-center w-full px-3 py-2 rounded-md transition-colors ${
                      minRating === rating
                        ? 'bg-rose-100 text-rose-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`h-4 w-4 ${
                            star <= rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="ml-2 text-sm">{rating > 0 ? `${rating}+ Stars` : 'All Ratings'}</span>
                    </div>
                  </button>
                ))}
              </div>
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
                  {loading ? 'Loading...' : `Showing ${products.length} products`}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <label htmlFor="sort" className="text-sm font-medium text-gray-700">
                  Sort by:
                </label>
                <select
                  id="sort"
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name-asc">Name: A to Z</option>
                  <option value="name-desc">Name: Z to A</option>
                </select>
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-square bg-gray-300 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-20"></div>
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                  {products.map((product) => (
                    <motion.div key={product.id} variants={itemVariants}>
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </motion.div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-12">
                    <nav className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      {[...Array(totalPages)].map((_, index) => {
                        const page = index + 1;
                        if (page === currentPage || page === 1 || page === totalPages || 
                            (page >= currentPage - 1 && page <= currentPage + 1)) {
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-2 text-sm border border-gray-300 rounded-md ${
                                currentPage === page
                                  ? 'bg-rose-600 text-white border-rose-600'
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return (
                            <span key={page} className="px-3 py-2 text-sm text-gray-500">
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">No products found</div>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setPriceRange({ min: 0, max: 50000 });
                    setMinRating(0);
                  }}
                  className="text-rose-600 hover:text-rose-700 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}