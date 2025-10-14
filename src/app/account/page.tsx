'use client';

import { useSession, signOut } from 'next-auth/react';
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
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

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
  const { data: session, status } = useSession();
  const router = useRouter();

  const sessionUser = (session?.user || null) as (typeof session extends { user: infer U } ? U : any) | null;
  const [editableProfile, setEditableProfile] = useState({
    firstName: (sessionUser as any)?.firstName || '',
    lastName: (sessionUser as any)?.lastName || '',
    email: sessionUser?.email || '',
    phone: (sessionUser as any)?.phone || '',
  });

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

  // Security: change password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const fetchOrders = async () => {
    if (!(sessionUser as any)?.id) return;
    setOrdersLoading(true);
    try {
      const response = await api.orders.getOrders({ userId: (sessionUser as any).id });
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
    if (!(sessionUser as any)?.id) return;
    setAddressesLoading(true);
    try {
      const response = await api.addresses.getAddresses((sessionUser as any).id);
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

  useEffect(() => {
    if (sessionUser) {
      setEditableProfile({
        firstName: (sessionUser as any).firstName || '',
        lastName: (sessionUser as any).lastName || '',
        email: sessionUser.email || '',
        phone: (sessionUser as any).phone || '',
      });
    }
  }, [sessionUser]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?redirect=/account');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated' && sessionUser) {
      if (activeSection === 'orders') fetchOrders();
      if (activeSection === 'addresses') fetchAddresses();
    }
  }, [status, sessionUser, activeSection]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  if (status !== 'authenticated' || !sessionUser) {
    return null;
  }

  const handleAddAddress = () => {
    setNewAddressData({
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
    setIsAddingAddress(true);
    setIsEditingAddress(false);
    setCurrentAddressToEdit(null);
  };

  const handleEditAddress = (address: ApiAddress) => {
    setCurrentAddressToEdit(address);
    setNewAddressData({
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
  };

  const handleAddressInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setNewAddressData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmitAddressForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const uid = (sessionUser as any)?.id;
    if (!uid) return;

    try {
      if (isEditingAddress && currentAddressToEdit) {
        const result = await api.addresses.updateAddress(currentAddressToEdit.id, newAddressData);
        if (result.address) {
          toast.success('Address updated successfully');
          setIsEditingAddress(false);
          setCurrentAddressToEdit(null);
          fetchAddresses();
        }
      } else {
        const result = await api.addresses.createAddress({ userId: uid, ...newAddressData });
        if (result.address) {
          toast.success('Address added successfully');
          setIsAddingAddress(false);
          fetchAddresses();
        }
      }
    } catch (error: unknown) {
      console.error('Error saving address:', error);
      toast.error((error as Error).message || 'An error occurred while saving the address');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    const uid = (sessionUser as any)?.id;
    if (!uid) return;
    try {
      const result = await api.addresses.deleteAddress(addressId);
      if (result.message) {
        toast.success('Address deleted successfully');
        fetchAddresses();
      }
    } catch (error: unknown) {
      console.error('Error deleting address:', error);
      toast.error((error as Error).message || 'An error occurred while deleting the address');
    }
  };

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
      const result = await api.users.updateMe({
        firstName: editableProfile.firstName,
        lastName: editableProfile.lastName,
        email: editableProfile.email,
        phone: editableProfile.phone,
      });
      if ((result as any).user) {
        const updated = (result as any).user;
        setEditableProfile(prev => ({
          ...prev,
          firstName: updated.firstName ?? prev.firstName,
          lastName: updated.lastName ?? prev.lastName,
          email: updated.email ?? prev.email,
          phone: updated.phone ?? prev.phone,
        }));
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      } else {
        const msg = (result as any).error || (result as any).message || 'Failed to update profile';
        toast.error(msg);
      }
    } catch (error) {
      toast.error('An error occurred while updating profile');
    }
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    toast.success('Signed out successfully!');
    router.push('/');
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmNewPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }
    try {
      setIsChangingPassword(true);
      const res = await api.auth.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      if ((res as any).success) {
        toast.success('Password changed successfully');
        setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      } else {
        const msg = (res as any).error || (res as any).message || 'Failed to change password';
        toast.error(msg);
      }
    } catch (err) {
      toast.error('An error occurred while changing password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
              <p className="text-gray-600">Manage your account settings and preferences</p>
            </div>
            <button onClick={handleSignOut} className="flex items-center px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">
              <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-6">
                <div className="h-16 w-16 rounded-full bg-rose-500 text-white flex items-center justify-center text-xl font-bold">
                  {(sessionUser as any).firstName?.[0]}{(sessionUser as any).lastName?.[0]}
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">{(sessionUser as any).firstName} {(sessionUser as any).lastName}</h3>
                  <p className="text-sm text-gray-500">Member since March 2024</p>
                </div>
              </div>
              <nav className="space-y-2">
                {accountMenuItems.map((item) => (
                  <button key={item.id} onClick={() => setActiveSection(item.id)} className={`w-full flex items-center px-3 py-2 rounded-md text-left transition-colors ${activeSection === item.id ? 'bg-rose-100 text-rose-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-6">
              {activeSection === 'profile' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                    <button onClick={() => setIsEditing(!isEditing)} className="flex items-center px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-md transition-colors">
                      <PencilIcon className="h-4 w-4 mr-2" />
                      {isEditing ? 'Cancel' : 'Edit'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      {isEditing ? (
                        <input type="text" id="firstName" name="firstName" value={editableProfile.firstName} onChange={handleProfileChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500" />
                      ) : (
                        <div className="px-3 py-2 bg-gray-50 rounded-md">{(sessionUser as any).firstName}</div>
                      )}
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      {isEditing ? (
                        <input type="text" id="lastName" name="lastName" value={editableProfile.lastName} onChange={handleProfileChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500" />
                      ) : (
                        <div className="px-3 py-2 bg-gray-50 rounded-md">{(sessionUser as any).lastName}</div>
                      )}
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      {isEditing ? (
                        <input type="email" id="email" name="email" value={editableProfile.email} onChange={handleProfileChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500" />
                      ) : (
                        <div className="px-3 py-2 bg-gray-50 rounded-md">{editableProfile.email}</div>
                      )}
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      {isEditing ? (
                        <input type="text" id="phone" name="phone" value={editableProfile.phone} onChange={handleProfileChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500" />
                      ) : (
                        <div className="px-3 py-2 bg-gray-50 rounded-md">{(sessionUser as any).phone || 'Not provided'}</div>
                      )}
                    </div>
                  </div>
                  {isEditing && (
                    <div className="mt-6 flex justify-end">
                      <button onClick={handleSaveProfile} className="px-6 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors">Save Changes</button>
                    </div>
                  )}
                </motion.div>
              )}

              {activeSection === 'orders' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">My Orders</h2>
                    <Link href="/orders" className="text-rose-600 hover:text-rose-700">View all orders</Link>
                  </div>
                  {ordersLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
                    </div>
                  ) : orders.length > 0 ? (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Order #{order.orderNumber}</p>
                              <p className="text-sm text-gray-600">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${getFinancialStatusColor(order.financialStatus)}`}>{order.financialStatus}</span>
                              <span className={`px-2 py-1 rounded-full text-xs ${getFulfillmentStatusColor(order.fulfillmentStatus)}`}>{order.fulfillmentStatus}</span>
                              <span className="font-semibold">{formatPrice(order.totalPrice)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <ShoppingBagIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
                      <p className="text-gray-600 mb-6">Start shopping to place your first order.</p>
                      <Link href="/products" className="inline-flex items-center px-6 py-3 bg-rose-600 text-white font-medium rounded-md hover:bg-rose-700 transition-colors">Browse Products</Link>
                    </div>
                  )}
                </motion.div>
              )}

              {activeSection === 'addresses' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Addresses</h2>
                    {!isAddingAddress && !isEditingAddress && (
                      <button onClick={handleAddAddress} className="inline-flex items-center px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors">Add Address</button>
                    )}
                  </div>
                  {isAddingAddress || isEditingAddress ? (
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <form onSubmit={handleSubmitAddressForm} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
                            <input type="text" id="firstName" name="firstName" value={newAddressData.firstName} onChange={handleAddressInputChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
                          </div>
                          <div>
                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
                            <input type="text" id="lastName" name="lastName" value={newAddressData.lastName} onChange={handleAddressInputChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
                          </div>
                          <div className="md:col-span-2">
                            <label htmlFor="address1" className="block text-sm font-medium text-gray-700">Address Line 1</label>
                            <input type="text" id="address1" name="address1" value={newAddressData.address1} onChange={handleAddressInputChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
                          </div>
                          <div className="md:col-span-2">
                            <label htmlFor="address2" className="block text-sm font-medium text-gray-700">Address Line 2</label>
                            <input type="text" id="address2" name="address2" value={newAddressData.address2} onChange={handleAddressInputChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
                          </div>
                          <div>
                            <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
                            <input type="text" id="city" name="city" value={newAddressData.city} onChange={handleAddressInputChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
                          </div>
                          <div>
                            <label htmlFor="state" className="block text-sm font-medium text-gray-700">State</label>
                            <input type="text" id="state" name="state" value={newAddressData.state} onChange={handleAddressInputChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
                          </div>
                          <div>
                            <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">Zip Code</label>
                            <input type="text" id="zipCode" name="zipCode" value={newAddressData.zipCode} onChange={handleAddressInputChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
                          </div>
                          <div>
                            <label htmlFor="country" className="block text-sm font-medium text-gray-700">Country</label>
                            <input type="text" id="country" name="country" value={newAddressData.country} onChange={handleAddressInputChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
                          </div>
                          <div className="md:col-span-2">
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                            <input type="text" id="phone" name="phone" value={newAddressData.phone} onChange={handleAddressInputChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center">
                            <input type="checkbox" id="isDefaultShipping" name="isDefaultShipping" checked={newAddressData.isDefaultShipping} onChange={handleAddressInputChange} className="h-4 w-4 text-rose-600 focus:ring-rose-500 border-gray-300 rounded" />
                            <label htmlFor="isDefaultShipping" className="ml-2 block text-sm text-gray-700">Set as Default Shipping Address</label>
                          </div>
                          <div className="flex items-center">
                            <input type="checkbox" id="isDefaultBilling" name="isDefaultBilling" checked={newAddressData.isDefaultBilling} onChange={handleAddressInputChange} className="h-4 w-4 text-rose-600 focus:ring-rose-500 border-gray-300 rounded" />
                            <label htmlFor="isDefaultBilling" className="ml-2 block text-sm text-gray-700">Set as Default Billing Address</label>
                          </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-4">
                          <button type="button" onClick={handleCancelAddressForm} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">Cancel</button>
                          <button type="submit" className="px-6 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors">{isAddingAddress ? 'Add Address' : 'Update Address'}</button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div>
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
                                    <button onClick={() => handleEditAddress(address)} className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Edit</button>
                                    <button onClick={() => handleDeleteAddress(address.id)} className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200 transition-colors">Delete</button>
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
                              <button onClick={handleAddAddress} className="inline-flex items-center px-6 py-3 bg-rose-600 text-white font-medium rounded-md hover:bg-rose-700 transition-colors">Add Address</button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {activeSection === 'security' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Security</h2>
                    <span className="text-sm text-gray-600">Update your password</span>
                  </div>
                  <form onSubmit={handleChangePassword} className="space-y-6 max-w-xl">
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                      <input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        autoComplete="current-password"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                        placeholder="Enter your current password"
                      />
                    </div>
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        autoComplete="new-password"
                        value={passwordData.newPassword}
                        onChange={handlePasswordInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                        placeholder="Enter a new password"
                      />
                      <p className="mt-1 text-xs text-gray-500">Minimum 8 characters.</p>
                    </div>
                    <div>
                      <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                      <input
                        id="confirmNewPassword"
                        name="confirmNewPassword"
                        type="password"
                        autoComplete="new-password"
                        value={passwordData.confirmNewPassword}
                        onChange={handlePasswordInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                        placeholder="Re-enter the new password"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isChangingPassword}
                        className="px-6 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {isChangingPassword ? 'Changing...' : 'Change Password'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}