'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
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
  UserIcon,
  HomeModernIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Order, Address, User } from '@/types';
import { api, ApiError } from '@/lib/services/api';

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
  { id: 'orders', name: 'My Orders', icon: ShoppingBagIcon, active: false, href: '/account/orders' },
  { id: 'wishlist', name: 'Wishlist', icon: HeartIcon, active: false, href: '/account/wishlist' },
  { id: 'addresses', name: 'Addresses', icon: MapPinIcon, active: false },
  { id: 'payments', name: 'Payment Methods', icon: CreditCardIcon, active: false },
  { id: 'notifications', name: 'Notifications', icon: BellIcon, active: false },
  { id: 'security', name: 'Security', icon: ShieldCheckIcon, active: false },
  { id: 'settings', name: 'Settings', icon: CogIcon, active: false },
];

export default function AccountPage() {
  const [activeSection, setActiveSection] = useState('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [currentAddressToEdit, setCurrentAddressToEdit] = useState<Address | null>(null);
  const { data: session, status } = useSession();
  const router = useRouter();
  // const pathname = usePathname(); // Removed as it's unused

  const sessionUser = (session?.user || null) as User | null;
  const [editableProfile, setEditableProfile] = useState({
    firstName: sessionUser?.firstName || '',
    lastName: sessionUser?.lastName || '',
    email: sessionUser?.email || '',
    phone: sessionUser?.phone || '',
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

  const fetchOrders = useCallback(async () => {
    if (!sessionUser?.id) return;
    setOrdersLoading(true);
    try {
      const response = await api.orders.getOrders({ userId: sessionUser.id });
      if (response.orders) {
        setOrders(response.orders);
      } else {
        toast.error('Failed to fetch orders');
      }
    } catch (error: unknown) {
      console.error('Error fetching orders:', error);
      const errorMessage = error instanceof ApiError ? error.message : 'An unknown error occurred.';
      toast.error(errorMessage || 'An error occurred while fetching orders');
    } finally {
      setOrdersLoading(false);
    }
  }, [sessionUser?.id]);

  const fetchAddresses = useCallback(async () => {
    if (session?.user?.id) {
      setAddressesLoading(true);
      try {
        const response = await api.addresses.getAddresses(session.user.id);
        setAddresses(response.addresses);
      } catch (error: unknown) {
        console.error('Error fetching addresses:', error);
        const errorMessage = error instanceof ApiError ? error.message : 'An unknown error occurred.';
        toast.error(errorMessage || 'An error occurred while fetching your addresses.');
      } finally {
        setAddressesLoading(false);
      }
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('auth/login');
    } else if (status === 'authenticated') {
      fetchOrders();
      fetchAddresses();
    }
  }, [status, router, fetchOrders, fetchAddresses]);

  // Handlers for Address Management
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

  const handleEditAddress = (address: Address) => {
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
    const uid = sessionUser?.id;
    if (!uid) return;

    const addressPayload = { ...newAddressData, userId: uid };

    try {
      if (isEditingAddress && currentAddressToEdit) {
        await api.addresses.updateAddress(currentAddressToEdit.id, addressPayload);
        toast.success('Address updated successfully!');
      } else {
        await api.addresses.createAddress(addressPayload);
        toast.success('Address added successfully!');
      }
      fetchAddresses(); // Refresh the addresses list
      handleCancelAddressForm(); // Close the form
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address.');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        await api.addresses.deleteAddress(addressId);
        toast.success('Address deleted successfully.');
        fetchAddresses(); // Refresh the list
      } catch (error) {
        console.error('Error deleting address:', error);
        toast.error('Failed to delete address.');
      }
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsEditingProfile(true);
    try {
      await api.users.updateMe(editableProfile);
      toast.success('Profile updated successfully!');
      setIsEditingProfile(false);
    } catch (error: unknown) {
      console.error('Error updating profile:', error);
      const errorMessage = error instanceof ApiError ? error.message : 'An unknown error occurred.';
      toast.error(errorMessage || 'Failed to update profile.');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    setIsChangingPassword(true);
    try {
      const result = await api.auth.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      if ('error' in result) {
        throw new Error(result.error);
      }
      toast.success('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (error: unknown) {
      console.error('Error changing password:', error);
      const errorMessage = error instanceof ApiError ? error.message : 'An unknown error occurred.';
      toast.error(errorMessage || 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (status === 'loading') {
    return <div className="flex h-screen items-center justify-center">Loading your account...</div>;
  }

  if (status === 'unauthenticated') {
    return null; // Or a message encouraging login/signup
  }

  return (
    <div className="bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-lg font-semibold leading-6 text-gray-900">My Account</h1>
        </div>
      </header>
      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-5">
          <aside className="px-2 py-6 sm:px-6 lg:col-span-3 lg:px-0 lg:py-0">
            <nav className="space-y-1">
              {accountMenuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href || '#'}
                  onClick={() => item.id && setActiveSection(item.id)}
                  className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                    activeSection === item.id
                      ? 'bg-gray-200 text-gray-900'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-6 w-6 flex-shrink-0 ${
                      activeSection === item.id ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.name}</span>
                </Link>
              ))}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  signOut();
                }}
                className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                <ArrowRightOnRectangleIcon
                  className="mr-3 h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-gray-500"
                  aria-hidden="true"
                />
                <span className="truncate">Sign Out</span>
              </a>
              {session?.user?.isAdmin && (
                <Link href="/admin" className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                  <HomeModernIcon
                    className="mr-3 h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-gray-500"
                    aria-hidden="true"
                  />
                  <span className="truncate">Admin Dashboard</span>
                </Link>
              )}
            </nav>
          </aside>

      <div className="space-y-6 sm:px-6 lg:col-span-9 lg:px-0">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeSection === 'profile' && (
            <form onSubmit={handleProfileUpdate}>
              <div className="shadow sm:overflow-hidden sm:rounded-md">
                <div className="bg-white px-4 py-6 sm:p-6">
                  <div>
                    <h2 className="text-lg font-medium leading-6 text-gray-900">Profile</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      This information will be displayed publicly so be careful what you share.
                    </p>
                  </div>

                  <div className="mt-6 grid grid-cols-4 gap-6">
                    <div className="col-span-4 sm:col-span-2">
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                        First name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        id="firstName"
                        value={editableProfile.firstName}
                        onChange={(e) => setEditableProfile({ ...editableProfile, firstName: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div className="col-span-4 sm:col-span-2">
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                        Last name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        id="lastName"
                        value={editableProfile.lastName}
                        onChange={(e) => setEditableProfile({ ...editableProfile, lastName: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div className="col-span-4 sm:col-span-2">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email address
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={editableProfile.email}
                        onChange={(e) => setEditableProfile({ ...editableProfile, email: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div className="col-span-4 sm:col-span-2">
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Phone
                      </label>
                      <input
                        type="text"
                        name="phone"
                        id="phone"
                        value={editableProfile.phone}
                        onChange={(e) => setEditableProfile({ ...editableProfile, phone: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
                  <button
                    type="submit"
                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeSection === 'addresses' && (
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium leading-6 text-gray-900">Addresses</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Manage your shipping and billing addresses.
                  </p>
                </div>
                <button
                  onClick={handleAddAddress}
                  className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                >
                  Add New Address
                </button>
              </div>

              {(isAddingAddress || isEditingAddress) && (
                <form onSubmit={handleSubmitAddressForm} className="mt-6">
                      <div className="shadow sm:overflow-hidden sm:rounded-md">
                        <div className="bg-white px-4 py-5 sm:p-6">
                          <h3 className="text-base font-medium text-gray-900">
                            {isEditingAddress ? 'Edit Address' : 'Add a new address'}
                          </h3>
                          {/* Form fields */}
                          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            <div className="sm:col-span-3">
                              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First name</label>
                              <input type="text" name="firstName" id="firstName" value={newAddressData.firstName} onChange={handleAddressInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
                            </div>
                            <div className="sm:col-span-3">
                              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last name</label>
                              <input type="text" name="lastName" id="lastName" value={newAddressData.lastName} onChange={handleAddressInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
                            </div>
                            <div className="sm:col-span-6">
                              <label htmlFor="address1" className="block text-sm font-medium text-gray-700">Address</label>
                              <input type="text" name="address1" id="address1" value={newAddressData.address1} onChange={handleAddressInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
                            </div>
                            <div className="sm:col-span-6">
                              <label htmlFor="address2" className="block text-sm font-medium text-gray-700">Apartment, suite, etc.</label>
                              <input type="text" name="address2" id="address2" value={newAddressData.address2} onChange={handleAddressInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
                            </div>
                            <div className="sm:col-span-2">
                              <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
                              <input type="text" name="city" id="city" value={newAddressData.city} onChange={handleAddressInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
                            </div>
                            <div className="sm:col-span-2">
                              <label htmlFor="state" className="block text-sm font-medium text-gray-700">State / Province</label>
                              <input type="text" name="state" id="state" value={newAddressData.state} onChange={handleAddressInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
                            </div>
                            <div className="sm:col-span-2">
                              <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">ZIP / Postal code</label>
                              <input type="text" name="zipCode" id="zipCode" value={newAddressData.zipCode} onChange={handleAddressInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
                            </div>
                            <div className="sm:col-span-6">
                              <label htmlFor="country" className="block text-sm font-medium text-gray-700">Country</label>
                              <input type="text" name="country" id="country" value={newAddressData.country} onChange={handleAddressInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
                            </div>
                            <div className="sm:col-span-6">
                              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                              <input type="text" name="phone" id="phone" value={newAddressData.phone} onChange={handleAddressInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
                            </div>
                            <div className="sm:col-span-6">
                              <div className="flex items-start">
                                <div className="flex h-5 items-center">
                                  <input id="isDefaultShipping" name="isDefaultShipping" type="checkbox" checked={newAddressData.isDefaultShipping} onChange={handleAddressInputChange} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                </div>
                                <div className="ml-3 text-sm">
                                  <label htmlFor="isDefaultShipping" className="font-medium text-gray-700">Set as default shipping address</label>
                                </div>
                              </div>
                            </div>
                            <div className="sm:col-span-6">
                              <div className="flex items-start">
                                <div className="flex h-5 items-center">
                                  <input id="isDefaultBilling" name="isDefaultBilling" type="checkbox" checked={newAddressData.isDefaultBilling} onChange={handleAddressInputChange} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                </div>
                                <div className="ml-3 text-sm">
                                  <label htmlFor="isDefaultBilling" className="font-medium text-gray-700">Set as default billing address</label>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
                          <button type="button" onClick={handleCancelAddressForm} className="mr-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                            Cancel
                          </button>
                          <button type="submit" className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">
                            Save Address
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {addressesLoading ? (
                      <p>Loading addresses...</p>
                    ) : addresses.length > 0 ? (
                      addresses.map((address) => (
                        <div key={address.id} className="relative rounded-lg border border-gray-300 bg-white p-4 shadow-sm">
                          <div className="flex justify-between">
                            <p className="font-semibold">{address.firstName} {address.lastName}</p>
                            <div>
                              {address.isDefaultShipping && <span className="mr-2 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Default Shipping</span>}
                              {address.isDefaultBilling && <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">Default Billing</span>}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">{address.address1}</p>
                          {address.address2 && <p className="text-sm text-gray-600">{address.address2}</p>}
                          <p className="text-sm text-gray-600">{address.city}, {address.state} {address.zipCode}</p>
                          <p className="text-sm text-gray-600">{address.country}</p>
                          {address.phone && <p className="text-sm text-gray-600">Phone: {address.phone}</p>}
                          <div className="absolute top-4 right-4 flex space-x-2">
                            <button onClick={() => handleEditAddress(address)} className="text-indigo-600 hover:text-indigo-900"><PencilIcon className="h-5 w-5" /></button>
                            <button onClick={() => handleDeleteAddress(address.id)} className="text-red-600 hover:text-red-900"><PencilIcon className="h-5 w-5" /></button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="mt-4 text-gray-600">You have no saved addresses.</p>
                    )}
                  </div>
                </div>
              )}

              {activeSection === 'security' && (
                <form onSubmit={handlePasswordChange}>
                  <div className="shadow sm:overflow-hidden sm:rounded-md">
                    <div className="bg-white px-4 py-6 sm:p-6">
                      <div>
                        <h2 className="text-lg font-medium leading-6 text-gray-900">Change Password</h2>
                        <p className="mt-1 text-sm text-gray-500">
                          Update your password for enhanced security.
                        </p>
                      </div>
                      <div className="mt-6 space-y-4">
                        <div>
                          <label
                            htmlFor="currentPassword"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Current Password
                          </label>
                          <input
                            type="password"
                            name="currentPassword"
                            id="currentPassword"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                            required
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="newPassword"
                            className="block text-sm font-medium text-gray-700"
                          >
                            New Password
                          </label>
                          <input
                            type="password"
                            name="newPassword"
                            id="newPassword"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                            required
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="confirmNewPassword"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            name="confirmNewPassword"
                            id="confirmNewPassword"
                            value={passwordData.confirmNewPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
                      <button
                        type="submit"
                        disabled={isChangingPassword}
                        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                      >
                        {isChangingPassword ? 'Saving...' : 'Save Password'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
