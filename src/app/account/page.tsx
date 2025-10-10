'use client';

import { useAuth } from '@/lib/contexts/auth-context';
import { api, ApiAddress, ApiOrder } from '@/lib/services/api';
import { formatPrice } from '@/lib/utils';
import {
  ArrowRightOnRectangleIcon,
  BellIcon,
  CogIcon,
  CreditCardIcon,
  HeartIcon,
  MapPinIcon,
  PencilIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

// Define the structure for address form inputs
interface AddressFormInput {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    slug: string;
    images: { src: string; alt: string }[];
  };
}


const accountMenuItems = [
  { id: 'profile', name: 'Profile', icon: UserIcon, active: true },
  { id: 'orders', name: 'My Orders', icon: ShoppingBagIcon, active: false },
  { id: 'wishlist', name: 'Wishlist', icon: HeartIcon, active: false },
  { id: 'addresses', name: 'Addresses', icon: MapPinIcon, active: false },
  { id: 'payments', name: 'Payment Methods', icon: CreditCardIcon, active: false },
  { id: 'notifications', name: 'Notifications', icon: BellIcon, active: false },
  { id: 'security', name: 'Security', icon: ShieldCheckIcon, active: false },
  { id: 'settings', name: 'Settings', icon: CogIcon, active: false },
];

export default function AccountPage() {
  const [activeSection, setActiveSection] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [addresses, setAddresses] = useState<ApiAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [currentAddressToEdit, setCurrentAddressToEdit] = useState<ApiAddress | null>(null);
  const { user, isAuthenticated, logout, updateUser, isLoading } = useAuth();
  const router = useRouter();

  const [editableProfile, setEditableProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  // State for new address form
  const [newAddressData, setNewAddressData] = useState<AddressFormInput>({
    firstName: '',
    lastName: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phone: '',
    isDefaultShipping: false,
    isDefaultBilling: false,
  });

  useEffect(() => {
    if (user) {
      setEditableProfile({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/account');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated && user && activeSection === 'orders') {
      fetchOrders();
    }
    if (isAuthenticated && user && activeSection === 'addresses') {
      fetchAddresses();
    }
  }, [isAuthenticated, user, activeSection, fetchAddresses, fetchOrders]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  const fetchOrders = async () => {
    if (!user?.id) return;
    setOrdersLoading(true);
    try {
      const response = await api.orders.getOrders({ userId: user.id });
      if (response.orders) {
        setOrders(response.orders);
      } else {
        toast.error('Failed to fetch orders');
      }
    } catch (error: unknown) {
      console.error('Error fetching orders:', error);
      toast.error((error as Error).message || 'An error occurred while fetching orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchAddresses = async () => {
    if (!user?.id) return;
    setAddressesLoading(true);
    try {
      const response = await api.addresses.getAddresses(user.id);
      if (response.addresses) {
        setAddresses(response.addresses);
      } else {
        toast.error('Failed to fetch addresses');
      }
    } catch (error: unknown) {
      console.error('Error fetching addresses:', error);
      toast.error((error as Error).message || 'An error occurred while fetching addresses');
    } finally {
      setAddressesLoading(false);
    }
  };

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  // Handlers for Address Management
  const handleAddAddress = () => {
    setNewAddressData({ // Reset form
      firstName: '', lastName: '', address1: '', address2: '', city: '',
      state: '', zipCode: '', country: '', phone: '', isDefaultShipping: false, isDefaultBilling: false,
    });
    setIsAddingAddress(true);
    setIsEditingAddress(false);
    setCurrentAddressToEdit(null);
  };

  const handleEditAddress = (address: ApiAddress) => {
    setCurrentAddressToEdit(address);
    setNewAddressData({ // Populate form with existing address data
      firstName: address.firstName || '',
      lastName: address.lastName || '',
      address1: address.address1 || '',
      address2: address.address2 || '',
      city: address.city || '',
      state: address.state || '',
      zipCode: address.zipCode || '',
      country: address.country || '',
      phone: address.phone || '',
      isDefaultShipping: address.isDefaultShipping || false,
      isDefaultBilling: address.isDefaultBilling || false,
    });
    setIsEditingAddress(true);
    setIsAddingAddress(false);
  };

  const handleCancelAddressForm = () => {
    setIsAddingAddress(false);
    setIsEditingAddress(false);
    setCurrentAddressToEdit(null);
    setNewAddressData({ // Reset form
      firstName: '', lastName: '', address1: '', address2: '', city: '',
      state: '', zipCode: '', country: '', phone: '', isDefaultShipping: false, isDefaultBilling: false,
    });
  };

  const handleSaveNewAddress = async () => {
    if (!user?.id) return;

    // Basic validation
    if (!newAddressData.firstName || !newAddressData.lastName || !newAddressData.address1 || !newAddressData.city || !newAddressData.state || !newAddressData.zipCode || !newAddressData.country) {
      toast.error('Please fill in all required address fields.');
      return;
    }

    try {
      const response = await api.addresses.addAddress({
        ...newAddressData,
        userId: user.id,
      });

      if (response.success && response.address) {
        toast.success('Address added successfully!');
        setAddresses(prevAddresses => [...prevAddresses, response.address]); // Add new address to local state
        handleCancelAddressForm(); // Close the form
        fetchAddresses(); // Re-fetch to ensure consistency
      } else {
        toast.error(response.error || 'Failed to add address');
      }
    } catch (error: unknown) {
      console.error('Error adding address:', error);
      toast.error((error as Error).message || 'An error occurred while adding address');
    }
  };

  const handleUpdateAddress = async () => {
    if (!currentAddressToEdit || !user?.id) return;

    // Basic validation
    if (!newAddressData.firstName || !newAddressData.lastName || !newAddressData.address1 || !newAddressData.city || !newAddressData.state || !newAddressData.zipCode || !newAddressData.country) {
      toast.error('Please fill in all required address fields.');
      return;
    }

    try {
      const response = await api.addresses.updateAddress({
        ...newAddressData,
        id: currentAddressToEdit.id,
        userId: user.id,
      });

      if (response.success) {
        toast.success('Address updated successfully!');
        setAddresses(prevAddresses =>
          prevAddresses.map(addr => (addr.id === currentAddressToEdit.id ? response.address : addr))
        ); // Update address in local state
        handleCancelAddressForm(); // Close the form
        fetchAddresses(); // Re-fetch to ensure consistency
      } else {
        toast.error(response.error || 'Failed to update address');
      }
    } catch (error: unknown) {
      console.error('Error updating address:', error);
      toast.error((error as Error).message || 'An error occurred while updating address');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;

    try {
      const response = await api.addresses.deleteAddress(addressId);
      if (response.success) {
        toast.success('Address deleted successfully!');
        setAddresses(prevAddresses => prevAddresses.filter(addr => addr.id !== addressId)); // Remove from local state
        fetchAddresses(); // Re-fetch to ensure consistency
      } else {
        toast.error(response.error || 'Failed to delete address');
      }
    } catch (error: unknown) {
      console.error('Error deleting address:', error);
      toast.error((error as Error).message || 'An error occurred while deleting address');
    }
  };

  const getFinancialStatusColor = (status: ApiOrder['financialStatus']) => {
>>>>
</replace_in_file>
<replace_in_file>
<path>src/app/account/page.tsx</path>
<diff>
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  const fetchOrders = async () => {
    if (!user?.id) return;
    setOrdersLoading(true);
    try {
      const response = await api.orders.getOrders({ userId: user.id });
      if (response.orders) {
        setOrders(response.orders);
      } else {
        toast.error('Failed to fetch orders');
      }
    } catch (error: unknown) {
      console.error('Error fetching orders:', error);
      toast.error((error as Error).message || 'An error occurred while fetching orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchAddresses = async () => {
    if (!user?.id) return;
    setAddressesLoading(true);
    try {
      const response = await api.addresses.getAddresses(user.id);
      if (response.addresses) {
        setAddresses(response.addresses);
      } else {
        toast.error('Failed to fetch addresses');
      }
    } catch (error: unknown) {
      console.error('Error fetching addresses:', error);
      toast.error((error as Error).message || 'An error occurred while fetching addresses');
    } finally {
      setAddressesLoading(false);
    }
  };

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  const getFinancialStatusColor = (status: ApiOrder['financialStatus']) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'refunded': return 'bg-red-100 text-red-800';
      case 'partially_refunded': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFulfillmentStatusColor = (status: ApiOrder['fulfillmentStatus']) => {
    switch (status) {
      case 'fulfilled': return 'bg-green-100 text-green-800';
      case 'unfulfilled': return 'bg-red-100 text-red-800';
      case 'partially_fulfilled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditableProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      const result = await updateUser(editableProfile);
      
      if (result.success) {
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('An error occurred while updating profile');
    }
  };

  const handleSignOut = () => {
    logout();
    toast.success('Signed out successfully!');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
              <p className="text-gray-600">Manage your account settings and preferences</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-6">
                <div className="h-16 w-16 rounded-full bg-rose-500 text-white flex items-center justify-center text-xl font-bold">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">Member since March 2024</p>
                </div>
              </div>

              <nav className="space-y-2">
                {accountMenuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center px-3 py-2 rounded-md text-left transition-colors ${
                      activeSection === item.id
                        ? 'bg-rose-100 text-rose-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-6">
              
              {/* Profile Section */}
              {activeSection === 'profile' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex items-center px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    >
                      <PencilIcon className="h-4 w-4 mr-2" />
                      {isEditing ? 'Cancel' : 'Edit'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={editableProfile.firstName}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-gray-50 rounded-md">{user.firstName}</div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={editableProfile.lastName}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-gray-50 rounded-md">{user.lastName}</div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      {isEditing ? (
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={editableProfile.email}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                          disabled // Email is often not editable directly
                        />
                      ) : (
                        <div className="px-3 py-2 bg-gray-50 rounded-md">{user.email}</div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={editableProfile.phone}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-gray-50 rounded-md">{user.phone || 'Not provided'}</div>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="mt-6 flex space-x-4">
                      <button
                        onClick={handleSaveProfile}
                        className="px-6 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Orders Section */}
              {activeSection === 'orders' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Order History</h2>
                    <Link
                      href="/shop"
                      className="text-rose-600 hover:text-rose-700 font-medium"
                    >
                      Continue Shopping
                    </Link>
                  </div>

                  {ordersLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {orders.map((order) => (
                        <div key={order.id} className="border border-gray-200 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-gray-900">Order #{order.orderNumber}</h3>
                              <p className="text-sm text-gray-500">
                                Placed on {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getFinancialStatusColor(order.financialStatus)}`}>
                                {order.financialStatus.replace(/_/g, ' ').split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getFulfillmentStatusColor(order.fulfillmentStatus)}`}>
                                {order.fulfillmentStatus.replace(/_/g, ' ').split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-4">
                            {order.items.map((item: OrderItem) => (
                              <div key={item.id} className="flex items-center space-x-4">
                                <div className="h-16 w-16 rounded-md overflow-hidden bg-gray-200 flex-shrink-0">
                                  {item.product.images?.[0]?.src && (
                                    <Image
                                      src={item.product.images[0].src}
                                      alt={item.product.name}
                                      width={64}
                                      height={64}
                                      className="h-full w-full object-cover"
                                    />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                  <p className="font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                            <p className="text-lg font-semibold text-gray-900">Total: {formatPrice(order.totalPrice)}</p>
                            <div className="flex space-x-3">
                              <Link href={`/order-confirmation/${order.id}`} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                View Details
                              </Link>
                              {/* Reorder button logic can be added here based on fulfillmentStatus */}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {orders.length === 0 && !ordersLoading && (
                    <div className="text-center py-12">
                      <ShoppingBagIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
                      <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
                      <Link
                        href="/shop"
                        className="inline-flex items-center px-6 py-3 bg-rose-600 text-white font-medium rounded-md hover:bg-rose-700 transition-colors"
                      >
                        Start Shopping
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Addresses Section */}
              {activeSection === 'addresses' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">My Addresses</h2>
                    <button
                      // onClick={() => handleAddAddress()} // Implement add address functionality
                      className="flex items-center px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    >
                      <MapPinIcon className="h-4 w-4 mr-2" />
                      Add New Address
                    </button>
                  </div>

                  {/* Address Form Modal */}
                  {(isAddingAddress || isEditingAddress) && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {isAddingAddress ? 'Add New Address' : 'Edit Address'}
                          </h3>
                          <button onClick={handleCancelAddressForm} className="text-gray-400 hover:text-gray-600 transition-colors">
                            &times;
                          </button>
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); isAddingAddress ? handleSaveNewAddress() : handleUpdateAddress(); }}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                              <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                value={newAddressData.firstName}
                                onChange={(e) => setNewAddressData({ ...newAddressData, firstName: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                                required
                              />
                            </div>
                            <div>
                              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                              <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                value={newAddressData.lastName}
                                onChange={(e) => setNewAddressData({ ...newAddressData, lastName: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                                required
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label htmlFor="address1" className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                              <input
                                type="text"
                                id="address1"
                                name="address1"
                                value={newAddressData.address1}
                                onChange={(e) => setNewAddressData({ ...newAddressData, address1: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                                required
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label htmlFor="address2" className="block text-sm font-medium text-gray-700 mb-1">Address Line 2 (Optional)</label>
                              <input
                                type="text"
                                id="address2"
                                name="address2"
                                value={newAddressData.address2}
                                onChange={(e) => setNewAddressData({ ...newAddressData, address2: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                              />
                            </div>
                            <div>
                              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
                              <input
                                type="text"
                                id="city"
                                name="city"
                                value={newAddressData.city}
                                onChange={(e) => setNewAddressData({ ...newAddressData, city: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                                required
                              />
                            </div>
                            <div>
                              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                              <input
                                type="text"
                                id="state"
                                name="state"
                                value={newAddressData.state}
                                onChange={(e) => setNewAddressData({ ...newAddressData, state: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                                required
                              />
                            </div>
                            <div>
                              <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">Zip/Postal Code</label>
                              <input
                                type="text"
                                id="zipCode"
                                name="zipCode"
                                value={newAddressData.zipCode}
                                onChange={(e) => setNewAddressData({ ...newAddressData, zipCode: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                                required
                              />
                            </div>
                            <div>
                              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                              <input
                                type="text"
                                id="country"
                                name="country"
                                value={newAddressData.country}
                                onChange={(e) => setNewAddressData({ ...newAddressData, country: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                                required
                              />
                            </div>
                            <div>
                              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
                              <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={newAddressData.phone}
                                onChange={(e) => setNewAddressData({ ...newAddressData, phone: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                              />
                            </div>
                          </div>

                          <div className="mt-6 flex items-center">
                            <input
                              type="checkbox"
                              id="isDefaultShipping"
                              name="isDefaultShipping"
                              checked={newAddressData.isDefaultShipping}
                              onChange={(e) => setNewAddressData({ ...newAddressData, isDefaultShipping: e.target.checked })}
                              className="h-4 w-4 text-rose-600 focus:ring-rose-500 border-gray-300 rounded"
                            />
                            <label htmlFor="isDefaultShipping" className="ml-2 block text-sm text-gray-700">Set as Default Shipping Address</label>
                          </div>
                          <div className="mt-2 flex items-center">
                            <input
                              type="checkbox"
                              id="isDefaultBilling"
                              name="isDefaultBilling"
                              checked={newAddressData.isDefaultBilling}
                              onChange={(e) => setNewAddressData({ ...newAddressData, isDefaultBilling: e.target.checked })}
                              className="h-4 w-4 text-rose-600 focus:ring-rose-500 border-gray-300 rounded"
                            />
                            <label htmlFor="isDefaultBilling" className="ml-2 block text-sm text-gray-700">Set as Default Billing Address</label>
                          </div>

                          <div className="mt-8 flex space-x-4 justify-end">
                            <button
                              type="button"
                              onClick={handleCancelAddressForm}
                              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-6 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors"
                            >
                              {isAddingAddress ? 'Add Address' : 'Update Address'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {addressesLoading ? (
                    <div className="flex justify-center items-center py-12">
>>>>
</replace_in_file>
<replace_in_file>
<path>src/app/account/page.tsx</path>
<diff>
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  const fetchOrders = async () => {
    if (!user?.id) return;
    setOrdersLoading(true);
    try {
      const response = await api.orders.getOrders({ userId: user.id });
      if (response.orders) {
        setOrders(response.orders);
      } else {
        toast.error('Failed to fetch orders');
      }
    } catch (error: unknown) {
      console.error('Error fetching orders:', error);
      toast.error((error as Error).message || 'An error occurred while fetching orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchAddresses = async () => {
    if (!user?.id) return;
    setAddressesLoading(true);
    try {
      const response = await api.addresses.getAddresses(user.id);
      if (response.addresses) {
        setAddresses(response.addresses);
      } else {
        toast.error('Failed to fetch addresses');
      }
    } catch (error: unknown) {
      console.error('Error fetching addresses:', error);
      toast.error((error as Error).message || 'An error occurred while fetching addresses');
    } finally {
      setAddressesLoading(false);
    }
  };

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  const getFinancialStatusColor = (status: ApiOrder['financialStatus']) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'refunded': return 'bg-red-100 text-red-800';
      case 'partially_refunded': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFulfillmentStatusColor = (status: ApiOrder['fulfillmentStatus']) => {
    switch (status) {
      case 'fulfilled': return 'bg-green-100 text-green-800';
      case 'unfulfilled': return 'bg-red-100 text-red-800';
      case 'partially_fulfilled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditableProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      const result = await updateUser(editableProfile);
      
      if (result.success) {
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('An error occurred while updating profile');
    }
  };

  const handleSignOut = () => {
    logout();
    toast.success('Signed out successfully!');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
              <p className="text-gray-600">Manage your account settings and preferences</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-6">
                <div className="h-16 w-16 rounded-full bg-rose-500 text-white flex items-center justify-center text-xl font-bold">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">Member since March 2024</p>
                </div>
              </div>

              <nav className="space-y-2">
                {accountMenuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center px-3 py-2 rounded-md text-left transition-colors ${
                      activeSection === item.id
                        ? 'bg-rose-100 text-rose-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-6">
              
              {/* Profile Section */}
              {activeSection === 'profile' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex items-center px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    >
                      <PencilIcon className="h-4 w-4 mr-2" />
                      {isEditing ? 'Cancel' : 'Edit'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={editableProfile.firstName}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-gray-50 rounded-md">{user.firstName}</div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={editableProfile.lastName}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-gray-50 rounded-md">{user.lastName}</div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      {isEditing ? (
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={editableProfile.email}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                          disabled // Email is often not editable directly
                        />
                      ) : (
                        <div className="px-3 py-2 bg-gray-50 rounded-md">{user.email}</div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={editableProfile.phone}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-gray-50 rounded-md">{user.phone || 'Not provided'}</div>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="mt-6 flex space-x-4">
                      <button
                        onClick={handleSaveProfile}
                        className="px-6 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Orders Section */}
              {activeSection === 'orders' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Order History</h2>
                    <Link
                      href="/shop"
                      className="text-rose-600 hover:text-rose-700 font-medium"
                    >
                      Continue Shopping
                    </Link>
                  </div>

                  {ordersLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {orders.map((order) => (
                        <div key={order.id} className="border border-gray-200 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-gray-900">Order #{order.orderNumber}</h3>
                              <p className="text-sm text-gray-500">
                                Placed on {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getFinancialStatusColor(order.financialStatus)}`}>
                                {order.financialStatus.replace(/_/g, ' ').split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getFulfillmentStatusColor(order.fulfillmentStatus)}`}>
                                {order.fulfillmentStatus.replace(/_/g, ' ').split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-4">
                            {order.items.map((item: OrderItem) => (
                              <div key={item.id} className="flex items-center space-x-4">
                                <div className="h-16 w-16 rounded-md overflow-hidden bg-gray-200 flex-shrink-0">
                                  {item.product.images?.[0]?.src && (
                                    <Image
                                      src={item.product.images[0].src}
                                      alt={item.product.name}
                                      width={64}
                                      height={64}
                                      className="h-full w-full object-cover"
                                    />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                  <p className="font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                            <p className="text-lg font-semibold text-gray-900">Total: {formatPrice(order.totalPrice)}</p>
                            <div className="flex space-x-3">
                              <Link href={`/order-confirmation/${order.id}`} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                View Details
                              </Link>
                              {/* Reorder button logic can be added here based on fulfillmentStatus */}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {orders.length === 0 && !ordersLoading && (
                    <div className="text-center py-12">
                      <ShoppingBagIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
                      <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
                      <Link
                        href="/shop"
                        className="inline-flex items-center px-6 py-3 bg-rose-600 text-white font-medium rounded-md hover:bg-rose-700 transition-colors"
                      >
                        Start Shopping
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Addresses Section */}
              {activeSection === 'addresses' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">My Addresses</h2>
                    <button
                      // onClick={() => handleAddAddress()} // Implement add address functionality
                      className="flex items-center px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    >
                      <MapPinIcon className="h-4 w-4 mr-2" />
                      Add New Address
                    </button>
                  </div>

                  {addressesLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {addresses.length > 0 ? (
                        addresses.map((address) => (
                          <div key={address.id} className="border border-gray-200 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="font-semibold text-gray-900">
                                {address.firstName} {address.lastName}
                                {address.isDefaultShipping && <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Default Shipping</span>}
                                {address.isDefaultBilling && <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Default Billing</span>}
                              </h3>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditAddress(address)}
                                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteAddress(address.id)}
                                  className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                            <p className="text-gray-600">{address.address1}</p>
                            {address.address2 && <p className="text-gray-600">{address.address2}</p>}
                            <p className="text-gray-600">{address.city}, {address.state} {address.zipCode}</p>
                            <p className="text-gray-600">{address.country}</p>
                            {address.phone && <p className="text-gray-600">Phone: {address.phone}</p>}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <MapPinIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No addresses saved</h3>
                          <p className="text-gray-600 mb-6">Add your shipping and billing addresses here.</p>
                          <button
                            onClick={handleAddAddress}
                            className="inline-flex items-center px-6 py-3 bg-rose-600 text-white font-medium rounded-md hover:bg-rose-700 transition-colors"
                          >
                            Add Address
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
>>>>
</replace_in_file>
<replace_in_file>
<path>src/app/account/page.tsx</path>
<diff>
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  const fetchOrders = async () => {
    if (!user?.id) return;
    setOrdersLoading(true);
    try {
      const response = await api.orders.getOrders({ userId: user.id });
      if (response.orders) {
        setOrders(response.orders);
      } else {
        toast.error('Failed to fetch orders');
      }
    } catch (error: unknown) {
      console.error('Error fetching orders:', error);
      toast.error((error as Error).message || 'An error occurred while fetching orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchAddresses = async () => {
    if (!user?.id) return;
    setAddressesLoading(true);
    try {
      const response = await api.addresses.getAddresses(user.id);
      if (response.addresses) {
        setAddresses(response.addresses);
      } else {
        toast.error('Failed to fetch addresses');
      }
    } catch (error: unknown) {
      console.error('Error fetching addresses:', error);
      toast.error((error as Error).message || 'An error occurred while fetching addresses');
    } finally {
      setAddressesLoading(false);
    }
  };

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  const getFinancialStatusColor = (status: ApiOrder['financialStatus']) => {
>>>>
</replace_in_file>
<replace_in_file>
<path>src/app/account/page.tsx</path>
<diff>
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  const fetchOrders = async () => {
    if (!user?.id) return;
    setOrdersLoading(true);
    try {
      const response = await api.orders.getOrders({ userId: user.id });
      if (response.orders) {
        setOrders(response.orders);
      } else {
        toast.error('Failed to fetch orders');
      }
    } catch (error: unknown) {
      console.error('Error fetching orders:', error);
      toast.error((error as Error).message || 'An error occurred while fetching orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchAddresses = async () => {
    if (!user?.id) return;
    setAddressesLoading(true);
    try {
      const response = await api.addresses.getAddresses(user.id);
      if (response.addresses) {
        setAddresses(response.addresses);
      } else {
        toast.error('Failed to fetch addresses');
      }
    } catch (error: unknown) {
      console.error('Error fetching addresses:', error);
      toast.error((error as Error).message || 'An error occurred while fetching addresses');
    } finally {
      setAddressesLoading(false);
    }
  };

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  const getFinancialStatusColor = (status: ApiOrder['financialStatus']) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'refunded': return 'bg-red-100 text-red-800';
      case 'partially_refunded': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFulfillmentStatusColor = (status: ApiOrder['fulfillmentStatus']) => {
    switch (status) {
      case 'fulfilled': return 'bg-green-100 text-green-800';
      case 'unfulfilled': return 'bg-red-100 text-red-800';
      case 'partially_fulfilled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditableProfile(prev => ({ ...prev, [name]: value }));
  };
>>>>
</replace_in_file>
<replace_in_file>
<path>src/app/account/page.tsx</path>
<diff>
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  const fetchOrders = async () => {
    if (!user?.id) return;
    setOrdersLoading(true);
    try {
      const response = await api.orders.getOrders({ userId: user.id });
      if (response.orders) {
        setOrders(response.orders);
      } else {
        toast.error('Failed to fetch orders');
      }
    } catch (error: unknown) {
      console.error('Error fetching orders:', error);
      toast.error((error as Error).message || 'An error occurred while fetching orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchAddresses = async () => {
    if (!user?.id) return;
    setAddressesLoading(true);
    try {
      const response = await api.addresses.getAddresses(user.id);
      if (response.addresses) {
        setAddresses(response.addresses);
      } else {
        toast.error('Failed to fetch addresses');
      }
    } catch (error: unknown) {
      console.error('Error fetching addresses:', error);
      toast.error((error as Error).message || 'An error occurred while fetching addresses');
    } finally {
      setAddressesLoading(false);
    }
  };

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  const getFinancialStatusColor = (status: ApiOrder['financialStatus']) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'refunded': return 'bg-red-100 text-red-800';
      case 'partially_refunded': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFulfillmentStatusColor = (status: ApiOrder['fulfillmentStatus']) => {
    switch (status) {
      case 'fulfilled': return 'bg-green-100 text-green-800';
      case 'unfulfilled': return 'bg-red-100 text-red-800';
      case 'partially_fulfilled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditableProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      const result = await updateUser(editableProfile);
      
      if (result.success) {
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('An error occurred while updating profile');
    }
  };

  const handleSignOut = () => {
    logout();
    toast.success('Signed out successfully!');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
>>>>
</replace_in_file>
<replace_in_file>
<path>src/app/account/page.tsx</path>
<diff>
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  const fetchOrders = async () => {
    if (!user?.id) return;
    setOrdersLoading(true);
    try {
      const response = await api.orders.getOrders({ userId: user.id });
      if (response.orders) {
        setOrders(response.orders);
      } else {
        toast.error('Failed to fetch orders');
      }
    } catch (error: unknown) {
      console.error('Error fetching orders:', error);
      toast.error((error as Error).message || 'An error occurred while fetching orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchAddresses = async () => {
    if (!user?.id) return;
    setAddressesLoading(true);
    try {
      const response = await api.addresses.getAddresses(user.id);
      if (response.addresses) {
        setAddresses(response.addresses);
      } else {
        toast.error('Failed to fetch addresses');
      }
    } catch (error: unknown) {
      console.error('Error fetching addresses:', error);
      toast.error((error as Error).message || 'An error occurred while fetching addresses');
    } finally {
      setAddressesLoading(false);
    }
  };

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  const getFinancialStatusColor = (status: ApiOrder['financialStatus']) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'refunded': return 'bg-red-100 text-red-800';
      case 'partially_refunded': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFulfillmentStatusColor = (status: ApiOrder['fulfillmentStatus']) => {
    switch (status) {
      case 'fulfilled': return 'bg-green-100 text-green-800';
      case 'unfulfilled': return 'bg-red-100 text-red-800';
      case 'partially_fulfilled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditableProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      const result = await updateUser(editableProfile);
      
      if (result.success) {
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('An error occurred while updating profile');
    }
  };

  const handleSignOut = () => {
    logout();
    toast.success('Signed out successfully!');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
              <p className="text-gray-600">Manage your account settings and preferences</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-6">
                <div className="h-16 w-16 rounded-full bg-rose-500 text-white flex items-center justify-center text-xl font-bold">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">Member since March 2024</p>
                </div>
              </div>

              <nav className="space-y-2">
                {accountMenuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center px-3 py-2 rounded-md text-left transition-colors ${
                      activeSection === item.id
                        ? 'bg-rose-100 text-rose-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-6">
              
              {/* Profile Section */}
              {activeSection === 'profile' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex items-center px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    >
                      <PencilIcon className="h-4 w-4 mr-2" />
                      {isEditing ? 'Cancel' : 'Edit'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={editableProfile.firstName}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-gray-50 rounded-md">{user.firstName}</div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={editableProfile.lastName}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-gray-50 rounded-md">{user.lastName}</div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      {isEditing ? (
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={editableProfile.email}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                          disabled // Email is often not editable directly
                        />
                      ) : (
                        <div className="px-3 py-2 bg-gray-50 rounded-md">{user.email}</div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={editableProfile.phone}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-gray-50 rounded-md">{user.phone || 'Not provided'}</div>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="mt-6 flex space-x-4">
                      <button
                        onClick={handleSaveProfile}
                        className="px-6 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Orders Section */}
              {activeSection === 'orders' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Order History</h2>
                    <Link
                      href="/shop"
                      className="text-rose-600 hover:text-rose-700 font-medium"
                    >
                      Continue Shopping
                    </Link>
                  </div>

                  {ordersLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {orders.map((order) => (
                        <div key={order.id} className="border border-gray-200 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-gray-900">Order #{order.orderNumber}</h3>
                              <p className="text-sm text-gray-500">
                                Placed on {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getFinancialStatusColor(order.financialStatus)}`}>
                                {order.financialStatus.replace(/_/g, ' ').split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getFulfillmentStatusColor(order.fulfillmentStatus)}`}>
                                {order.fulfillmentStatus.replace(/_/g, ' ').split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-4">
                            {order.items.map((item: OrderItem) => (
                              <div key={item.id} className="flex items-center space-x-4">
                                <div className="h-16 w-16 rounded-md overflow-hidden bg-gray-200 flex-shrink-0">
                                  {item.product.images?.[0]?.src && (
                                    <Image
                                      src={item.product.images[0].src}
                                      alt={item.product.name}
                                      width={64}
                                      height={64}
                                      className="h-full w-full object-cover"
                                    />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                  <p className="font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                            <p className="text-lg font-semibold text-gray-900">Total: {formatPrice(order.totalPrice)}</p>
                            <div className="flex space-x-3">
                              <Link href={`/order-confirmation/${order.id}`} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                View Details
                              </Link>
                              {/* Reorder button logic can be added here based on fulfillmentStatus */}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {orders.length === 0 && !ordersLoading && (
                    <div className="text-center py-12">
                      <ShoppingBagIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
                      <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
                      <Link
                        href="/shop"
                        className="inline-flex items-center px-6 py-3 bg-rose-600 text-white font-medium rounded-md hover:bg-rose-700 transition-colors"
                      >
                        Start Shopping
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Addresses Section */}
              {activeSection === 'addresses' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">My Addresses</h2>
                    <button
                      // onClick={() => handleAddAddress()} // Implement add address functionality
                      className="flex items-center px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    >
                      <MapPinIcon className="h-4 w-4 mr-2" />
                      Add New Address
                    </button>
                  </div>

                  {addressesLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {addresses.length > 0 ? (
                        addresses.map((address) => (
                          <div key={address.id} className="border border-gray-200 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="font-semibold text-gray-900">
                                {address.firstName} {address.lastName}
                                {address.isDefaultShipping && <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Default Shipping</span>}
                                {address.isDefaultBilling && <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Default Billing</span>}
                              </h3>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditAddress(address)}
                                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteAddress(address.id)}
                                  className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                            <p className="text-gray-600">{address.address1}</p>
                            {address.address2 && <p className="text-gray-600">{address.address2}</p>}
                            <p className="text-gray-600">{address.city}, {address.state} {address.zipCode}</p>
                            <p className="text-gray-600">{address.country}</p>
                            {address.phone && <p className="text-gray-600">Phone: {address.phone}</p>}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <MapPinIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No addresses saved</h3>
                          <p className="text-gray-600 mb-6">Add your shipping and billing addresses here.</p>
                          <button
                            onClick={handleAddAddress}
                            className="inline-flex items-center px-6 py-3 bg-rose-600 text-white font-medium rounded-md hover:bg-rose-700 transition-colors"
                          >
                            Add Address
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
>>>>
</replace_in_file>
<replace_in_file>
<path>src/app/account/page.tsx</path>
<diff>
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  const fetchOrders = async () => {
    if (!user?.id) return;
    setOrdersLoading(true);
    try {
      const response = await api.orders.getOrders({ userId: user.id });
      if (response.orders) {
        setOrders(response.orders);
      } else {
        toast.error('Failed to fetch orders');
      }
    } catch (error: unknown) {
      console.error('Error fetching orders:', error);
      toast.error((error as Error).message || 'An error occurred while fetching orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchAddresses = async () => {
    if (!user?.id) return;
    setAddressesLoading(true);
    try {
      const response = await api.addresses.getAddresses(user.id);
      if (response.addresses) {
        setAddresses(response.addresses);
      } else {
        toast.error('Failed to fetch addresses');
      }
    } catch (error: unknown) {
      console.error('Error fetching addresses:', error);
      toast.error((error as Error).message || 'An error occurred while fetching addresses');
    } finally {
      setAddressesLoading(false);
    }
  };

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  const getFinancialStatusColor = (status: ApiOrder['financialStatus']) => {
>>>>
</replace_in_file>
<replace_in_file>
<path>src/app/account/page.tsx</path>
<diff>
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  const fetchOrders = async () => {
    if (!user?.id) return;
    setOrdersLoading(true);
    try {
      const response = await api.orders.getOrders({ userId: user.id });
      if (response.orders) {
        setOrders(response.orders);
      } else {
        toast.error('Failed to fetch orders');
      }
    } catch (error: unknown) {
      console.error('Error fetching orders:', error);
      toast.error((error as Error).message || 'An error occurred while fetching orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchAddresses = async () => {
    if (!user?.id) return;
    setAddressesLoading(true);
    try {
      const response = await api.addresses.getAddresses(user.id);
      if (response.addresses) {
        setAddresses(response.addresses);
      } else {
        toast.error('Failed to fetch addresses');
      }
    } catch (error: unknown) {
      console.error('Error fetching addresses:', error);
      toast.error((error as Error).message || 'An error occurred while fetching addresses');
    } finally {
      setAddressesLoading(false);
    }
  };

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  const getFinancialStatusColor = (status: ApiOrder['financialStatus']) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'refunded': return 'bg-red-100 text-red-800';
      case 'partially_refunded': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFulfillmentStatusColor = (status: ApiOrder['fulfillmentStatus']) => {
    switch (status) {
      case 'fulfilled': return 'bg-green-100 text-green-800';
      case 'unfulfilled': return 'bg-red-100 text-red-800';
      case 'partially_fulfilled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditableProfile(prev => ({ ...prev, [name]: value }));
  };
>>>>
</replace_in_file>
<replace_in_file>
<path>src/app/account/page.tsx</path>
<diff>
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  const fetchOrders = async () => {
    if (!user?.id) return;
    setOrdersLoading(true);
    try {
      const response = await api.orders.getOrders({ userId: user.id });
      if (response.orders) {
        setOrders(response.orders);
      } else {
        toast.error('Failed to fetch orders');
      }
    } catch (error: unknown) {
      console.error('Error fetching orders:', error);
      toast.error((error as Error).message || 'An error occurred while fetching orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchAddresses = async () => {
    if (!user?.id) return;
    setAddressesLoading(true);
    try {
      const response = await api.addresses.getAddresses(user.id);
      if (response.addresses) {
        setAddresses(response.addresses);
      } else {
        toast.error('Failed to fetch addresses');
      }
    } catch (error: unknown) {
      console.error('Error fetching addresses:', error);
      toast.error((error as Error).message || 'An error occurred while fetching addresses');
    } finally {
      setAddressesLoading(false);
    }
  };

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  const getFinancialStatusColor = (status: ApiOrder['financialStatus']) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'refunded': return 'bg-red-100 text-red-800';
      case 'partially_refunded': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFulfillmentStatusColor = (status: ApiOrder['fulfillmentStatus']) => {
    switch (status) {
      case 'fulfilled': return 'bg-green-100 text-green-800';
      case 'unfulfilled': return 'bg-red-100 text-red-800';
      case 'partially_fulfilled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditableProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      const result = await updateUser(editableProfile);
      
      if (result.success) {
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('An error occurred while updating profile');
    }
  };

  const handleSignOut = () => {
    logout();
    toast.success('Signed out successfully!');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
>>>>
</replace_in_file>
<replace_in_file>
<path>src/app/account/page.tsx</path>
<diff>
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  const fetchOrders = async () => {
    if (!user?.id) return;
    setOrdersLoading(true);
    try {
      const response = await api.orders.getOrders({ userId: user.id });
      if (response.orders) {
        setOrders(response.orders);
      } else {
        toast.error('Failed to fetch orders');
      }
    } catch (error: unknown) {
      console.error('Error fetching orders:', error);
      toast.error((error as Error).message || 'An error occurred while fetching orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchAddresses = async () => {
    if (!user?.id) return;
    setAddressesLoading(true);
    try {
      const response = await api.addresses.getAddresses(user.id);
      if (response.addresses) {
        setAddresses(response.addresses);
      } else {
        toast.error('Failed to fetch addresses');
      }
    } catch (error: unknown) {
      console.error('Error fetching addresses:', error);
      toast.error((error as Error).message || 'An error occurred while fetching addresses');
    } finally {
      setAddressesLoading(false);
    }
  };

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  const getFinancialStatusColor = (status: ApiOrder['financialStatus']) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'refunded': return 'bg-red-100 text-red-800';
      case 'partially_refunded': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFulfillmentStatusColor = (status: ApiOrder['fulfillmentStatus']) => {
    switch (status) {
      case 'fulfilled': return 'bg-green-100 text-green-800';
      case 'unfulfilled': return 'bg-red-100 text-red-800';
      case 'partially_fulfilled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditableProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      const result = await updateUser(editableProfile);
      
      if (result.success) {
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('An error occurred while updating profile');
    }
  };

  const handleSignOut = () => {
    logout();
    toast.success('Signed out successfully!');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
              <p className="text-gray-600">Manage your account settings and preferences</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-6">
                <div className="h-16 w-16 rounded-full bg-rose-500 text-white flex items-center justify-center text-xl font-bold">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">Member since March 2024</p>
                </div>
              </div>

              <nav className="space-y-2">
                {accountMenuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center px-3 py-2 rounded-md text-left transition-colors ${
                      activeSection === item.id
                        ? 'bg-rose-100 text-rose-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-6">
              
              {/* Profile Section */}
              {activeSection === 'profile' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex items-center px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    >
                      <PencilIcon className="h-4 w-4 mr-2" />
                      {isEditing ? 'Cancel' : 'Edit'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={editableProfile.firstName}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-gray-50 rounded-md">{user.firstName}</div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={editableProfile.lastName}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-gray-50 rounded-md">{user.lastName}</div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      {isEditing ? (
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={editableProfile.email}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                          disabled // Email is often not editable directly
                        />
                      ) : (
                        <div className="px-3 py-2 bg-gray-50 rounded-md">{user.email}</div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={editableProfile.phone}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-gray-50 rounded-md">{user.phone || 'Not provided'}</div>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="mt-6 flex space-x-4">
                      <button
                        onClick={handleSaveProfile}
                        className="px-6 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Orders Section */}
              {activeSection === 'orders' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Order History</h2>
                    <Link
                      href="/shop"
                      className="text-rose-600 hover:text-rose-700 font-medium"
                    >
                      Continue Shopping
                    </Link>
                  </div>

                  {ordersLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {orders.map((order) => (
                        <div key={order.id} className="border border-gray-200 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-gray-900">Order #{order.orderNumber}</h3>
                              <p className="text-sm text-gray-500">
                                Placed on {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getFinancialStatusColor(order.financialStatus)}`}>
                                {order.financialStatus.replace(/_/g, ' ').split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getFulfillmentStatusColor(order.fulfillmentStatus)}`}>
                                {order.fulfillmentStatus.replace(/_/g, ' ').split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-4">
                            {order.items.map((item: OrderItem) => (
                              <div key={item.id} className="flex items-center space-x-4">
                                <div className="h-16 w-16 rounded-md overflow-hidden bg-gray-200 flex-shrink-0">
                                  {item.product.images?.[0]?.src && (
                                    <Image
                                      src={item.product.images[0].src}
                                      alt={item.product.name}
                                      width={64}
                                      height={64}
                                      className="h-full w-full object-cover"
                                    />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                  <p className="font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                            <p className="text-lg font-semibold text-gray-900">Total: {formatPrice(order.totalPrice)}</p>
                            <div className="flex space-x-3">
                              <Link href={`/order-confirmation/${order.id}`} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                View Details
                              </Link>
                              {/* Reorder button logic can be added here based on fulfillmentStatus */}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {orders.length === 0 && !ordersLoading && (
                    <div className="text-center py-12">
                      <ShoppingBagIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
                      <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
                      <Link
                        href="/shop"
                        className="inline-flex items-center px-6 py-3 bg-rose-600 text-white font-medium rounded-md hover:bg-rose-700 transition-colors"
                      >
                        Start Shopping
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Addresses Section */}
              {activeSection === 'addresses' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">My Addresses</h2>
                    <button
                      // onClick={() => handleAddAddress()} // Implement add address functionality
                      className="flex items-center px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    >
                      <MapPinIcon className="h-4 w-4 mr-2" />
                      Add New Address
                    </button>
                  </div>

                  {addressesLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {addresses.length > 0 ? (
                        addresses.map((address) => (
                          <div key={address.id} className="border border-gray-200 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="font-semibold text-gray-900">
                                {address.firstName} {address.lastName}
                                {address.isDefaultShipping && <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Default Shipping</span>}
                                {address.isDefaultBilling && <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Default Billing</span>}
                              </h3>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditAddress(address)}
                                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteAddress(address.id)}
                                  className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                            <p className="text-gray-600">{address.address1}</p>
                            {address.address2 && <p className="text-gray-600">{address.address2}</p>}
                            <p className="text-gray-600">{address.city}, {address.state} {address.zipCode}</p>
                            <p className="text-gray-600">{address.country}</p>
                            {address.phone && <p className="text-gray-600">Phone: {address.phone}</p>}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <MapPinIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No addresses saved</h3>
                          <p className="text-gray-600 mb-6">Add your shipping and billing addresses here.</p>
                          <button
                            onClick={handleAddAddress}
                            className="inline-flex items-center px-6 py-3 bg-rose-600 text-white font-medium rounded-md hover:bg-rose-700 transition-colors"
                          >
                            Add Address
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
>>>>
</replace_in_file>
<replace_in_file>
<path>src/app/account/page.tsx</path>
<diff>
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  const fetchOrders = async () => {
    if (!user?.id) return;
    setOrdersLoading(true);
    try {
      const response = await api.orders.getOrders({ userId: user.id });
      if (response.orders) {
        setOrders(response.orders);
      } else {
        toast.error('Failed to fetch orders');
      }
    } catch (error: unknown) {
      console.error('Error fetching orders:', error);
      toast.error((error as Error).message || 'An error occurred while fetching orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchAddresses = async () => {
    if (!user?.id) return;
    setAddressesLoading(true);
    try {
      const response = await api.addresses.getAddresses(user.id);
      if (response.addresses) {
        setAddresses(response.addresses);
      } else {
        toast.error('Failed to fetch addresses');
      }
    } catch (error: unknown) {
      console.error('Error fetching addresses:', error);
      toast.error((error as Error).message || 'An error occurred while fetching addresses');
    } finally {
      setAddressesLoading(false);
    }
  };

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  const getFinancialStatusColor = (status: ApiOrder['financialStatus']) => {
>>>>
</replace_in_file>
<replace_in_file>
<path>src/app/account/page.tsx</path>
<diff>
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  const fetchOrders = async () => {
    if (!user?.id) return;
    setOrdersLoading(true);
    try {
      const response = await api.orders.getOrders({ userId: user.id });
      if (response.orders) {
        setOrders(response.orders);
      } else {
        toast.error('Failed to fetch orders');
      }
    } catch (error: unknown) {
      console.error('Error fetching orders:', error);
      toast.error((error as Error).message || 'An error occurred while fetching orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchAddresses = async () => {
    if (!user?.id) return;
    setAddressesLoading(true);
    try {
      const response = await api.addresses.getAddresses(user.id);
      if (response.addresses) {
        setAddresses(response.addresses);
      } else {
        toast.error('Failed to fetch addresses');
      }
    } catch (error: unknown) {
      console.error('Error fetching addresses:', error);
      toast.error((error as Error).message || 'An error occurred while fetching addresses');
    } finally {
      setAddressesLoading(false);
    }
  };

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  const getFinancialStatusColor = (status: ApiOrder['financialStatus']) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'refunded': return 'bg-red-100 text-red-800';
      case 'partially_refunded': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFulfillmentStatusColor = (status: ApiOrder['fulfillmentStatus']) => {
    switch (status) {
      case 'fulfilled': return 'bg-green-100 text-green-800';
      case 'unfulfilled': return 'bg-red-100 text-red-800';
      case 'partially_fulfilled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditableProfile(prev => ({ ...prev, [name]: value }));
  };
>>>>
</replace_in_file>
<replace_in_file>
<path>src/app/account/page.tsx</path>
<diff>
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  const fetchOrders = async () => {
    if (!user?.id) return;
    setOrdersLoading(true);
    try {
      const response = await api.orders.getOrders({ userId: user.id });
      if (response.orders) {
        setOrders(response.orders);
      } else {
        toast.error('Failed to fetch orders');
      }
    } catch (error: unknown) {
      console.error('Error fetching orders:', error);
      toast.error((error as Error).message || 'An error occurred while fetching orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchAddresses = async () => {
    if (!user?.id) return;
    setAddressesLoading(true);
    try {
      const response = await api.addresses.getAddresses(user.id);
      if (response.addresses) {
        setAddresses(response.addresses);
      } else {
        toast.error('Failed to fetch addresses');
      }
    } catch (error: unknown) {
      console.error('Error fetching addresses:', error);
      toast.error((error as Error).message || 'An error occurred while fetching addresses');
    } finally {
      setAddressesLoading(false);
    }
  };

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  const getFinancialStatusColor = (status: ApiOrder['financialStatus']) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'refunded': return 'bg-red-100 text-red-800';
      case 'partially_refunded': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFulfillmentStatusColor = (status: ApiOrder['fulfillmentStatus']) => {
    switch (status) {
      case 'fulfilled': return 'bg-green-100 text-green-800';
      case 'unfulfilled': return 'bg-red-100 text-red-800';
      case 'partially_fulfilled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditableProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      const result = await updateUser(editableProfile);
      
      if (result.success) {
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('An error occurred while updating profile');
    }
  };

  const handleSignOut = () => {
    logout();
    toast.success('Signed out successfully!');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
>>>>
</replace_in_file>
<replace_in_file>
<path>src/app/account/page.tsx</path>
