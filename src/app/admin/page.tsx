'use client';

import Image from 'next/image'; // Import Next.js Image component
import ProductModal from '@/components/admin/ProductModal';
import { useSession } from 'next-auth/react';
import { orderAPI, productAPI, reviewAPI, blogAPI, api, type ApiProduct, type ApiBlogPost, type ApiOrder, type ApiReview, type ApiReturnRequest } from '@/lib/services/api';
import { useOrderStore } from '@/lib/store/order-store';
import { useReviewsStore } from '@/lib/store/reviews-store';
import { formatPrice } from '@/lib/utils';
import {
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  EyeIcon,
  PencilIcon,
  ShoppingBagIcon,
  TrashIcon,
  UsersIcon,
  XCircleIcon,
  ArrowPathIcon,
  HomeIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import RichTextEditor from '@/components/admin/RichTextEditor';
import ImageUpload from '@/components/admin/ImageUpload';
import { BulkProductUpload } from '@/components/admin/BulkProductUpload'; // Import the new component
import { type Session } from 'next-auth'; // Import Session type from next-auth

// Admin check based solely on isAdmin flag (remove brand-specific emails)
const isAdmin = (sessionUser: Session['user'] | undefined) => {
  return sessionUser?.isAdmin === true;
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: number;
  color?: string;
  description?: string;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const { orders } = useOrderStore();
  const { reviews } = useReviewsStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Database state
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [dbOrders, setDbOrders] = useState<ApiOrder[]>([]);
  const [dbReviews, setDbReviews] = useState<ApiReview[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [blogPosts, setBlogPosts] = useState<ApiBlogPost[]>([]);
  const [returnRequests, setReturnRequests] = useState<ApiReturnRequest[]>([]);
  const [isSubmittingBlog, setIsSubmittingBlog] = useState(false);
  const [blogForm, setBlogForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImage: '',
    tags: '',
    published: false,
  });
  
  // Modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ApiProduct | null>(null);
  
  // Statistics state
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    totalProducts: 0,
    totalReviews: 0,
  });

  // Load data from database
  const loadData = async () => {
    setIsLoadingData(true);
    try {
      const [productsRes, ordersRes, reviewsRes, blogsRes, returnsRes] = await Promise.all([
        productAPI.getProducts({ limit: 100 }),
        orderAPI.getOrders({ limit: 100 }),
        reviewAPI.getReviews({ limit: 100 }),
        blogAPI.getPosts({ limit: 100, published: undefined }),
        api.returns.getAllReturnRequests(),
      ]);
      
      console.log('Admin loadData - Products response:', productsRes);
      console.log('Admin loadData - Products count:', productsRes.products.length);
      
      setProducts(productsRes.products);
      setDbOrders(ordersRes.orders);
      setDbReviews(reviewsRes.reviews);
      setBlogPosts(blogsRes.posts);
      setReturnRequests(returnsRes.returnRequests);
      
      // Calculate stats
      setStats({
        totalOrders: ordersRes.orders.length,
        totalRevenue: ordersRes.orders.reduce((sum, order) => sum + order.totalPrice, 0),
        pendingOrders: ordersRes.orders.filter(order => order.financialStatus === 'pending').length,
        totalProducts: productsRes.products.length,
        totalReviews: reviewsRes.reviews.length,
      });
    } catch (error: unknown) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    const sessionUser = session?.user;
    if (status === 'loading') return;
    if (status !== 'authenticated' || !isAdmin(sessionUser)) {
      router.push('/auth/login?redirect=/admin');
      return;
    }
    loadData();
  }, [status, session, router]);

  // Product management functions
  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsProductModalOpen(true);
  };

  const handleEditProduct = (product: ApiProduct) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = async (product: ApiProduct) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    try {
      await productAPI.deleteProduct(product.slug);
      toast.success('Product deleted successfully!');
      await loadData(); // Refresh data
    } catch (error: unknown) {
      console.error('Error deleting product:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete product');
    }
  };

  const handleProductModalSuccess = async () => {
    await loadData(); // Refresh data after product create/update
  };

  // Blog management functions
  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogForm.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setIsSubmittingBlog(true);
    try {
      const generatedSlug = blogForm.title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      const payload = {
        title: blogForm.title.trim(),
        slug: (blogForm.slug || generatedSlug).trim(),
        excerpt: blogForm.excerpt.trim() || undefined,
        content: blogForm.content.trim(),
        coverImage: blogForm.coverImage.trim() || undefined,
        tags: blogForm.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        published: blogForm.published,
      };
      await blogAPI.createPost(payload);
      toast.success('Blog post created');
      setBlogForm({ title: '', slug: '', excerpt: '', content: '', coverImage: '', tags: '', published: false });
      await loadData();
    } catch (error: unknown) {
      console.error('Error creating blog post:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create blog post');
    } finally {
      setIsSubmittingBlog(false);
    }
  };

  const handleDeleteBlog = async (post: ApiBlogPost) => {
    if (!confirm(`Delete blog post "${post.title}"?`)) return;
    try {
      await blogAPI.deletePost(post.id);
      toast.success('Blog post deleted');
      await loadData();
    } catch (error: unknown) {
      console.error('Error deleting blog post:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete blog post');
    }
  };

  const handleTogglePublish = async (post: ApiBlogPost) => {
    try {
      await blogAPI.updatePost(post.id, { published: !post.published });
      toast.success(post.published ? 'Unpublished' : 'Published');
      await loadData();
    } catch (error: unknown) {
      console.error('Error updating publish status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update publish status');
    }
  };

  const handleUpdateReturnStatus = async (returnId: string, status: string, adminNotes?: string) => {
    try {
      await api.returns.updateReturnStatus(returnId, status, adminNotes);
      toast.success('Return status updated successfully');
      await loadData(); // Refresh the list
    } catch (error: unknown) {
      console.error('Error updating return status:', error);
      toast.error('Failed to update return status');
    }
  };

  if (status === 'loading' || isLoadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  if (status !== 'authenticated' || !isAdmin(session?.user)) {
    return null;
  }

  // Use real database data for display
  const displayOrders = dbOrders.length > 0 ? dbOrders : orders;
  const displayReviews = dbReviews.length > 0 ? dbReviews : reviews;
  
  const recentOrders = displayOrders.slice(0, 5);
  const recentReviews = displayReviews.slice(0, 5);

  const StatCard = ({ title, value, icon: Icon, trend, color = 'rose', description }: StatCardProps) => {
    // Define proper color mappings for Tailwind classes
    const colorClasses = {
      rose: 'from-rose-500 to-rose-600',
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      yellow: 'from-yellow-500 to-yellow-600',
      indigo: 'from-indigo-500 to-indigo-600',
      orange: 'from-orange-500 to-orange-600',
      pink: 'from-pink-500 to-pink-600',
    };

    const gradientClass = colorClasses[color as keyof typeof colorClasses] || colorClasses.rose;

    return (
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${gradientClass} shadow-lg`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">{title}</p>
                {description && (
                  <p className="text-xs text-gray-500 mt-1">{description}</p>
                )}
              </div>
            </div>
            <div className="flex items-end space-x-2">
              <p className="text-3xl font-bold text-gray-900">{value}</p>
              {trend && (
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                  trend > 0 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  <ArrowTrendingUpIcon className={`h-3 w-3 ${trend < 0 ? 'rotate-180' : ''}`} />
                  <span>{Math.abs(trend)}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Navigation items for sidebar
  const navigationItems = [
    { id: 'dashboard', name: 'Dashboard', icon: HomeIcon, color: 'blue' },
    { id: 'orders', name: 'Orders', icon: ShoppingBagIcon, color: 'green' },
    { id: 'products', name: 'Products', icon: CurrencyRupeeIcon, color: 'purple' },
    { id: 'bulk-upload', name: 'Bulk Upload', icon: ArrowPathIcon, color: 'indigo' },
    { id: 'returns', name: 'Returns', icon: ArrowPathIcon, color: 'orange' },
    { id: 'blog', name: 'Blog', icon: DocumentTextIcon, color: 'pink' },
    { id: 'reviews', name: 'Reviews', icon: StarIcon, color: 'yellow' },
  ];

  const Sidebar = () => {
    // Define proper color mappings for navigation items
    const getActiveColorClass = (color: string) => {
      const colorMap: { [key: string]: string } = {
        blue: 'bg-gradient-to-r from-blue-500 to-blue-600',
        green: 'bg-gradient-to-r from-green-500 to-green-600',
        purple: 'bg-gradient-to-r from-purple-500 to-purple-600',
        indigo: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
        orange: 'bg-gradient-to-r from-orange-500 to-orange-600',
        pink: 'bg-gradient-to-r from-pink-500 to-pink-600',
        yellow: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
      };
      return colorMap[color] || 'bg-gradient-to-r from-blue-500 to-blue-600';
    };

    return (
      <div className="flex flex-col h-full">
        {/* Logo and Brand */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Elanorra</h2>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Admin Panel</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigationItems.map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setActiveTab(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeTab === item.id
                  ? `${getActiveColorClass(item.color)} text-white shadow-lg`
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
              {activeTab === item.id && (
                <motion.div
                  layoutId="activeTab"
                  className="ml-auto w-2 h-2 bg-white rounded-full"
                />
              )}
            </motion.button>
          ))}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {session?.user?.firstName?.charAt(0) || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {session?.user?.firstName} {session?.user?.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">Administrator</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="absolute left-0 top-0 h-full w-80 bg-white shadow-2xl"
            >
              <Sidebar />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-80 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white shadow-xl border-r border-gray-200">
          <Sidebar />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-80">
        {/* Top header */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Bars3Icon className="h-6 w-6 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    {navigationItems.find(item => item.id === activeTab)?.name || 'Dashboard'}
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Welcome back, {session?.user?.firstName}! Here's what's happening today.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/')}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <HomeIcon className="h-4 w-4" />
                  <span>View Store</span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Dashboard Overview */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Orders"
                  value={stats.totalOrders}
                  icon={ShoppingBagIcon}
                  trend={12}
                  color="blue"
                  description="This month"
                />
                <StatCard
                  title="Revenue"
                  value={formatPrice(stats.totalRevenue)}
                  icon={CurrencyRupeeIcon}
                  trend={8}
                  color="green"
                  description="Total earnings"
                />
                <StatCard
                  title="Products"
                  value={stats.totalProducts}
                  icon={ChartBarIcon}
                  color="purple"
                  description="In inventory"
                />
                <StatCard
                  title="Pending Orders"
                  value={stats.pendingOrders}
                  icon={ClockIcon}
                  color="orange"
                  description="Awaiting processing"
                />
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Orders */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
                >
                  <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-500 rounded-lg">
                          <ShoppingBagIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                          <p className="text-sm text-gray-600">Latest customer orders</p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveTab('orders')}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        View All
                      </motion.button>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {recentOrders.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        <ShoppingBagIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p>No orders yet</p>
                      </div>
                    ) : (
                      recentOrders.map((order) => (
                        <motion.div
                          key={order.id}
                          whileHover={{ backgroundColor: '#f8fafc' }}
                          className="p-4 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                  <span className="text-white font-medium text-sm">
                                    {order.email?.charAt(0).toUpperCase() || 'U'}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    #{order.orderNumber}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {order.email}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(order.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-gray-900">
                                {formatPrice(order.totalPrice)}
                              </p>
                              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                order.financialStatus === 'paid' 
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {order.financialStatus}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>

                {/* Recent Reviews */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
                >
                  <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-yellow-50 to-orange-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-yellow-500 rounded-lg">
                          <StarIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Recent Reviews</h3>
                          <p className="text-sm text-gray-600">Customer feedback</p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveTab('reviews')}
                        className="text-yellow-600 hover:text-yellow-700 font-medium text-sm"
                      >
                        View All
                      </motion.button>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {recentReviews.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        <StarIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p>No reviews yet</p>
                      </div>
                    ) : (
                      recentReviews.map((review) => (
                        <motion.div
                          key={review.id}
                          whileHover={{ backgroundColor: '#f8fafc' }}
                          className="p-4 transition-colors"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {review.userName?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {review.userName}
                                </p>
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <StarIcon
                                      key={i}
                                      className={`h-3 w-3 ${
                                        i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-xs text-gray-600 font-medium">{review.title}</p>
                              <p className="text-xs text-gray-600 line-clamp-2">
                                {review.comment}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              </div>
          </div>
        )}

          {/* Orders Management */}
           {activeTab === 'orders' && (
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
             >
               <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
                 <div className="flex items-center space-x-3">
                   <div className="p-2 bg-green-500 rounded-lg">
                     <ShoppingBagIcon className="h-6 w-6 text-white" />
                   </div>
                   <div>
                     <h3 className="text-xl font-semibold text-gray-900">Orders Management</h3>
                     <p className="text-sm text-gray-600">Manage customer orders and fulfillment</p>
                   </div>
                 </div>
               </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">#{order.orderNumber}</div>
                          <div className="text-sm text-gray-500">{order.items.length} items</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.email}</div>
                        <div className="text-sm text-gray-500">
                          {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            order.financialStatus === 'paid' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.financialStatus}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            order.fulfillmentStatus === 'fulfilled' 
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {order.fulfillmentStatus}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatPrice(order.totalPrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => router.push(`/admin/orders/${order.id}`)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Order"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-900">
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

          {/* Products Management */}
           {activeTab === 'products' && (
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
             >
               <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center space-x-3">
                     <div className="p-2 bg-purple-500 rounded-lg">
                       <CurrencyRupeeIcon className="h-6 w-6 text-white" />
                     </div>
                     <div>
                       <h3 className="text-xl font-semibold text-gray-900">Products Management</h3>
                       <p className="text-sm text-gray-600">Manage your product catalog</p>
                     </div>
                   </div>
                   <motion.button
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={handleAddProduct}
                     className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                   >
                     <span>Add Product</span>
                   </motion.button>
                 </div>
               </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-12 w-12 rounded-lg bg-gray-200 mr-4">
                            <Image
                              src={product.images[0]?.src || '/images/placeholder.svg'}
                              alt={product.name}
                              width={48}
                              height={48}
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">{product.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {product.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPrice(product.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.inventory}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          product.inStock 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.inStock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => router.push(`/products/${product.slug}`)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Product"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleEditProduct(product)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Edit Product"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(product)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Product"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

          {/* Bulk Upload Section */}
           {activeTab === 'bulk-upload' && (
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.5 }}
               className="bg-gradient-to-br from-white via-gray-50 to-white rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden"
             >
               {/* Header Section */}
               <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-8">
                 <div className="absolute inset-0 bg-black/10"></div>
                 <div className="relative z-10 flex items-center space-x-4">
                   <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                     <ArrowPathIcon className="h-6 w-6 text-white" />
                   </div>
                   <div>
                     <h3 className="text-2xl font-bold text-white">Bulk Product Upload</h3>
                     <p className="text-white/80 mt-1">Upload multiple products efficiently with CSV files</p>
                   </div>
                 </div>
                 <div className="absolute top-4 right-4">
                   <div className="w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
                 </div>
               </div>

               <div className="p-8">
                 <div className="max-w-4xl mx-auto">
                   {/* Instructions Section */}
                   <motion.div
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.5, delay: 0.1 }}
                     className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl p-6 mb-8"
                   >
                     <div className="flex items-start space-x-4">
                       <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                         <DocumentTextIcon className="h-4 w-4 text-white" />
                       </div>
                       <div className="flex-1">
                         <h4 className="text-lg font-bold text-gray-900 mb-3">CSV Format Requirements</h4>
                         <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-blue-200/30">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-medium text-gray-800">Required CSV columns (in order):</p>
                              <a 
                                href="/sample-products.csv" 
                                download="sample-products.csv"
                                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full transition-colors duration-200 flex items-center space-x-1"
                              >
                                <DocumentTextIcon className="h-3 w-3" />
                                <span>Download Sample</span>
                              </a>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs text-gray-700 overflow-x-auto">
                              name,slug,description,price,compareAtPrice,category,tags,inStock,inventory,weight,dimensions
                            </div>
                          </div>
                         <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="bg-white/60 rounded-lg p-3 border border-blue-200/30">
                             <h5 className="font-semibold text-gray-800 text-sm mb-2">📋 Data Tips:</h5>
                             <ul className="text-xs text-gray-600 space-y-1">
                               <li>• Use TRUE/FALSE for inStock field</li>
                               <li>• Separate tags with commas</li>
                               <li>• Price should be numeric (e.g., 29.99)</li>
                               <li>• Slug should be URL-friendly</li>
                             </ul>
                           </div>
                           <div className="bg-white/60 rounded-lg p-3 border border-blue-200/30">
                             <h5 className="font-semibold text-gray-800 text-sm mb-2">⚡ Processing:</h5>
                             <ul className="text-xs text-gray-600 space-y-1">
                               <li>• Existing products will be updated</li>
                               <li>• New products will be created</li>
                               <li>• Invalid rows will be skipped</li>
                               <li>• Results will be shown after upload</li>
                             </ul>
                           </div>
                         </div>
                       </div>
                     </div>
                   </motion.div>

                   {/* Upload Component */}
                   <motion.div
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.5, delay: 0.2 }}
                     className="bg-white rounded-xl shadow-lg border border-gray-200/50 p-8"
                   >
                     <BulkProductUpload />
                   </motion.div>
                 </div>
               </div>
             </motion.div>
           )}

          {/* Returns Management */}
          {activeTab === 'returns' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-red-50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-500 rounded-lg">
                    <ArrowPathIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Returns Management</h3>
                    <p className="text-sm text-gray-600">Handle customer return requests</p>
                  </div>
                </div>
              </div>
            <div className="p-6">
              <div className="space-y-6">
                {returnRequests.length === 0 && (
                  <p className="text-sm text-gray-500">No return requests yet.</p>
                )}
                {returnRequests.map((returnRequest) => (
                  <div key={returnRequest.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-gray-900">Return Request #{returnRequest.id.slice(-8)}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            returnRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            returnRequest.status === 'approved' ? 'bg-green-100 text-green-800' :
                            returnRequest.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {returnRequest.status.charAt(0).toUpperCase() + returnRequest.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Order: #{returnRequest.order.orderNumber} • Customer: {returnRequest.order.user?.firstName} {returnRequest.order.user?.lastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          Email: {returnRequest.order.user?.email} • Created: {new Date(returnRequest.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h5 className="font-medium text-gray-900 mb-2">Reason:</h5>
                      <p className="text-gray-700">{returnRequest.reason}</p>
                    </div>
                    
                    <div className="mb-4">
                      <h5 className="font-medium text-gray-900 mb-2">Items to Return:</h5>
                      <div className="space-y-2">
                        {returnRequest.items.map((item) => (
                          <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{item.orderItem.product.name}</p>
                              <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {returnRequest.status === 'pending' && (
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleUpdateReturnStatus(returnRequest.id, 'approved')}
                          className="px-4 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                        >
                          Approve Return
                        </button>
                        <button
                          onClick={() => handleUpdateReturnStatus(returnRequest.id, 'rejected', 'Return request rejected by admin')}
                          className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                        >
                          Reject Return
                        </button>
                      </div>
                    )}
                    
                    {returnRequest.status === 'approved' && (
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleUpdateReturnStatus(returnRequest.id, 'processed', 'Refund processed')}
                          className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                        >
                          Mark as Processed
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

          {/* Blog Management */}
          {activeTab === 'blog' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-br from-white via-gray-50 to-white rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden"
            >
              {/* Header Section */}
              <div className="relative bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-8">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10 flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <DocumentTextIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Blog Management</h3>
                    <p className="text-white/80 mt-1">Create engaging content and manage your blog posts</p>
                  </div>
                </div>
                <div className="absolute top-4 right-4">
                  <div className="w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                  {/* Create Blog Post Section */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="space-y-6"
                  >
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/50 rounded-xl p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                          <PencilIcon className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">Create New Post</h4>
                          <p className="text-sm text-gray-600">Craft compelling content for your audience</p>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleCreateBlog} className="space-y-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">Post Title</label>
                          <input
                            type="text"
                            value={blogForm.title}
                            onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                            placeholder="Enter an engaging title..."
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">URL Slug</label>
                          <input
                            type="text"
                            value={blogForm.slug}
                            onChange={(e) => setBlogForm({ ...blogForm, slug: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                            placeholder="auto-generated from title if left empty"
                          />
                          <p className="mt-2 text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-lg">
                            💡 Example: elegant-pottery-making-guide
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">Excerpt</label>
                          <textarea
                            value={blogForm.excerpt}
                            onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white/80 backdrop-blur-sm resize-none"
                            placeholder="Write a compelling excerpt to attract readers..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">Content</label>
                          <div className="rounded-xl overflow-hidden border border-gray-300 shadow-sm">
                            <RichTextEditor
                              value={blogForm.content}
                              onChange={(html) => setBlogForm({ ...blogForm, content: html })}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">Cover Image</label>
                          <div className="bg-gray-50 rounded-xl p-4 border-2 border-dashed border-gray-300">
                            <ImageUpload
                              images={blogForm.coverImage ? [blogForm.coverImage] : []}
                              maxImages={1}
                              onImagesChange={(imgs) => setBlogForm({ ...blogForm, coverImage: imgs[0] || '' })}
                            />
                            <p className="mt-2 text-xs text-gray-500 text-center">
                              📸 Recommended size: 1200x600px for optimal display
                            </p>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">Tags</label>
                          <input
                            type="text"
                            value={blogForm.tags}
                            onChange={(e) => setBlogForm({ ...blogForm, tags: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                            placeholder="pottery, design, crafts, tutorial"
                          />
                          <p className="mt-2 text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-lg">
                            🏷️ Separate tags with commas for better organization
                          </p>
                        </div>

                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-xl p-4">
                          <div className="flex items-center space-x-3">
                            <input
                              id="published"
                              type="checkbox"
                              checked={blogForm.published}
                              onChange={(e) => setBlogForm({ ...blogForm, published: e.target.checked })}
                              className="h-5 w-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                            />
                            <label htmlFor="published" className="flex items-center space-x-2 text-sm font-medium text-gray-800">
                              <CheckCircleIcon className="h-4 w-4 text-green-600" />
                              <span>Publish immediately</span>
                            </label>
                          </div>
                          <p className="text-xs text-gray-600 mt-2 ml-8">
                            {blogForm.published ? '✅ Post will be visible to readers' : '📝 Save as draft for later'}
                          </p>
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={isSubmittingBlog}
                        className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {isSubmittingBlog ? (
                          <>
                            <ArrowPathIcon className="h-5 w-5 animate-spin" />
                            <span>Creating Post...</span>
                          </>
                        ) : (
                          <>
                            <DocumentTextIcon className="h-5 w-5" />
                            <span>Create Blog Post</span>
                          </>
                        )}
                      </motion.button>
                    </form>
                  </motion.div>

                  {/* Blog Posts List */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200/50 rounded-xl p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                          <DocumentTextIcon className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">Published Posts</h4>
                          <p className="text-sm text-gray-600">Manage your existing blog content</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {blogPosts.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300"
                        >
                          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500 font-medium">No blog posts yet</p>
                          <p className="text-sm text-gray-400 mt-1">Create your first post to get started!</p>
                        </motion.div>
                      ) : (
                        blogPosts.map((post, index) => (
                          <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 mr-4">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h5 className="font-bold text-gray-900 text-lg">{post.title}</h5>
                                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                    post.published 
                                      ? 'bg-green-100 text-green-700 border border-green-200' 
                                      : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                  }`}>
                                    {post.published ? '✅ Published' : '📝 Draft'}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  <span className="font-medium">URL:</span> /{post.slug}
                                </p>
                                {post.publishedAt && (
                                  <p className="text-xs text-gray-500">
                                    📅 Published on {new Date(post.publishedAt).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleTogglePublish(post)}
                                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                    post.published 
                                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border border-yellow-300' 
                                      : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
                                  }`}
                                >
                                  {post.published ? '📝 Unpublish' : '🚀 Publish'}
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => router.push(`/blog/${post.slug}`)}
                                  className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300 transition-all duration-200"
                                >
                                  👁️ View
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleDeleteBlog(post)}
                                  className="px-4 py-2 text-sm font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200 border border-red-300 transition-all duration-200"
                                >
                                  🗑️ Delete
                                </motion.button>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Reviews Management */}
          {activeTab === 'reviews' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Reviews Management</h3>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center text-white font-medium">
                          {review.userName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{review.userName}</span>
                            {review.verified && (
                              <CheckCircleIcon className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                              >
                                ★
                              </div>
                            ))}
                            <span className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="text-green-600 hover:text-green-900">
                          <CheckCircleIcon className="h-5 w-5" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <XCircleIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Product ID: {review.productId}</span>
                      <span>{review.helpful} people found this helpful</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
      
      {/* Product Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={selectedProduct}
        onSuccess={handleProductModalSuccess}
      />
    </div>
  );
}
