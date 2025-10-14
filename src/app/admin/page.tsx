'use client';

import ProductModal from '@/components/admin/ProductModal';
import { useSession } from 'next-auth/react';
import { orderAPI, productAPI, reviewAPI, blogAPI, type ApiProduct, type ApiBlogPost } from '@/lib/services/api';
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
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import RichTextEditor from '@/components/admin/RichTextEditor';
import ImageUpload from '@/components/admin/ImageUpload';

// Admin check based solely on isAdmin flag (remove brand-specific emails)
const isAdmin = (user: any) => {
  return user?.isAdmin === true;
};

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const { orders } = useOrderStore();
  const { reviews } = useReviewsStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Database state
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [dbOrders, setDbOrders] = useState<any[]>([]);
  const [dbReviews, setDbReviews] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [blogPosts, setBlogPosts] = useState<ApiBlogPost[]>([]);
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
      const [productsRes, ordersRes, reviewsRes, blogsRes] = await Promise.all([
        productAPI.getProducts({ limit: 100 }),
        orderAPI.getOrders({ limit: 100 }),
        reviewAPI.getReviews({ limit: 100 }),
        blogAPI.getPosts({ limit: 100, published: undefined }),
      ]);
      
      setProducts(productsRes.products);
      setDbOrders(ordersRes.orders);
      setDbReviews(reviewsRes.reviews);
      setBlogPosts(blogsRes.posts);
      
      // Calculate stats
      setStats({
        totalOrders: ordersRes.orders.length,
        totalRevenue: ordersRes.orders.reduce((sum, order) => sum + order.totalPrice, 0),
        pendingOrders: ordersRes.orders.filter(order => order.financialStatus === 'pending').length,
        totalProducts: productsRes.products.length,
        totalReviews: reviewsRes.reviews.length,
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    const user = session?.user as any;
    if (status === 'loading') return;
    if (status !== 'authenticated' || !isAdmin(user)) {
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
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error(error.message || 'Failed to delete product');
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
    } catch (error: any) {
      console.error('Error creating blog post:', error);
      toast.error(error.message || 'Failed to create blog post');
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
    } catch (error: any) {
      console.error('Error deleting blog post:', error);
      toast.error(error.message || 'Failed to delete blog post');
    }
  };

  const handleTogglePublish = async (post: ApiBlogPost) => {
    try {
      await blogAPI.updatePost(post.id, { published: !post.published });
      toast.success(post.published ? 'Unpublished' : 'Published');
      await loadData();
    } catch (error: any) {
      console.error('Error updating publish status:', error);
      toast.error(error.message || 'Failed to update publish status');
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

  const StatCard = ({ title, value, icon: Icon, trend, color = 'rose' }: any) => (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Welcome back, {(session?.user as any)?.firstName}!</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                View Store
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: ChartBarIcon },
              { id: 'orders', name: 'Orders', icon: ShoppingBagIcon },
              { id: 'products', name: 'Products', icon: CurrencyRupeeIcon },
              { id: 'blog', name: 'Blog', icon: PencilIcon },
              { id: 'reviews', name: 'Reviews', icon: UsersIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 font-medium text-sm rounded-full transition-all ${
                  activeTab === tab.id
                    ? (tab.id === 'blog'
                        ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-sm ring-2 ring-rose-400'
                        : 'bg-rose-100 text-rose-700')
                    : (tab.id === 'blog'
                        ? 'text-gray-700 border border-rose-200 hover:bg-rose-50 hover:text-rose-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100')
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

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
              />
              <StatCard
                title="Revenue"
                value={formatPrice(stats.totalRevenue)}
                icon={CurrencyRupeeIcon}
                trend={8}
                color="green"
              />
              <StatCard
                title="Products"
                value={stats.totalProducts}
                icon={ChartBarIcon}
                color="purple"
              />
              <StatCard
                title="Pending Orders"
                value={stats.pendingOrders}
                icon={ClockIcon}
                color="orange"
              />
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Orders */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                        <div>
                          <p className="font-medium text-gray-900">#{order.orderNumber}</p>
                          <p className="text-sm text-gray-600">{order.email}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatPrice(order.totalPrice)}</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            order.financialStatus === 'paid' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.financialStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Reviews */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Reviews</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {recentReviews.map((review) => (
                      <div key={review.id} className="py-3 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {review.userName.charAt(0)}
                            </div>
                            <span className="font-medium text-gray-900">{review.userName}</span>
                          </div>
                          <div className="flex items-center">
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
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 font-medium">{review.title}</p>
                        <p className="text-sm text-gray-500 line-clamp-2">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Orders Management */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Orders Management</h3>
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
                          <div className="text-sm text-gray-500">{order.lineItems.length} items</div>
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
          </div>
        )}

        {/* Products Management */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Products Management</h3>
              <button 
                onClick={handleAddProduct}
                className="px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors"
              >
                Add Product
              </button>
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
                            <img
                              src={product.images[0]?.src || '/images/placeholder.jpg'}
                              alt={product.name}
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
          </div>
        )}

        {/* Blog Management */}
        {activeTab === 'blog' && (
          <div className="bg-white rounded-xl shadow border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Blog Management</h3>
              <p className="text-sm text-gray-600">Create and manage blog posts.</p>
            </div>
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Create Blog Post */}
              <form onSubmit={handleCreateBlog} className="space-y-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-md font-semibold text-gray-900">Create New Post</h4>
                  <p className="text-sm text-gray-600">Add content, cover image and publish.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    value={blogForm.title}
                    onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Slug</label>
                  <input
                    type="text"
                    value={blogForm.slug}
                    onChange={(e) => setBlogForm({ ...blogForm, slug: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                    placeholder="auto-generated from title if left empty"
                  />
                  <p className="mt-1 text-xs text-gray-500">Example: elegant-pottery-making</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Excerpt</label>
                  <textarea
                    value={blogForm.excerpt}
                    onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Content</label>
                  <div className="mt-1">
                    <RichTextEditor
                      value={blogForm.content}
                      onChange={(html) => setBlogForm({ ...blogForm, content: html })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cover Image</label>
                  <div className="mt-1">
                    <ImageUpload
                      images={blogForm.coverImage ? [blogForm.coverImage] : []}
                      maxImages={1}
                      onImagesChange={(imgs) => setBlogForm({ ...blogForm, coverImage: imgs[0] || '' })}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Recommended size 1200x600. First image used as cover.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={blogForm.tags}
                    onChange={(e) => setBlogForm({ ...blogForm, tags: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                    placeholder="e.g. pottery, design"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    id="published"
                    type="checkbox"
                    checked={blogForm.published}
                    onChange={(e) => setBlogForm({ ...blogForm, published: e.target.checked })}
                    className="h-4 w-4 text-rose-600 border-gray-300 rounded"
                  />
                  <label htmlFor="published" className="ml-2 block text-sm text-gray-700">
                    Publish immediately
                  </label>
                </div>
                <div>
                  <button
                    type="submit"
                    disabled={isSubmittingBlog}
                    className="px-4 py-2 rounded-md bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow hover:from-rose-700 hover:to-pink-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmittingBlog ? 'Creating...' : 'Create Post'}
                  </button>
                </div>
              </form>

              {/* Blog Posts List */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-4">Existing Posts</h4>
                <div className="space-y-4">
                  {blogPosts.length === 0 && (
                    <p className="text-sm text-gray-500">No blog posts yet.</p>
                  )}
                  {blogPosts.map((post) => (
                    <div key={post.id} className="border border-gray-200 rounded-lg p-4 flex items-start justify-between">
                      <div className="mr-4">
                        <p className="font-medium text-gray-900">{post.title}</p>
                        <p className="text-sm text-gray-600">/{post.slug}</p>
                        <p className="text-xs text-gray-500">
                          {post.published ? 'Published' : 'Draft'}
                          {post.publishedAt && ` · ${new Date(post.publishedAt).toLocaleDateString()}`}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleTogglePublish(post)}
                          className={`px-3 py-1 text-xs rounded-md ${post.published ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}
                        >
                          {post.published ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          onClick={() => router.push(`/blog/${post.slug}`)}
                          className="px-3 py-1 text-xs rounded-md bg-blue-100 text-blue-700"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDeleteBlog(post)}
                          className="px-3 py-1 text-xs rounded-md bg-red-100 text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
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