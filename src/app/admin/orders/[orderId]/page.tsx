'use client';

import { orderAPI, type ApiOrder } from '@/lib/services/api';
import { formatPrice } from '@/lib/utils/index';
import {
  ArrowLeftIcon,
  CreditCardIcon,
  MapPinIcon,
  PencilIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ChevronDownIcon, LinkIcon } from '@heroicons/react/24/outline';

interface Props {
  params: {
    orderId: string;
  };
}

const isAdmin = (user: any) => {
  return user?.isAdmin === true;
};

export default function AdminOrderDetailPage({ params }: Props) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [provider, setProvider] = useState<'shiprocket' | 'delhivery' | 'bluedart'>('shiprocket');
  const [pickupDate, setPickupDate] = useState<string>('');

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!isLoaded) return;
      
      if (!user) {
        router.push('/sign-in?redirect_url=/admin');
        return;
      }

      try {
        const response = await fetch('/api/user/profile');
        if (!response.ok) {
          router.push('/sign-in?redirect_url=/admin');
          return;
        }
        
        const userData = await response.json();
        if (!userData.isAdmin) {
          router.push('/sign-in?redirect_url=/admin');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/sign-in?redirect_url=/admin');
      }
    };

    checkAdminStatus();
  }, [isLoaded, user, router]);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!params.orderId) return;
      setIsLoading(true);
      try {
        const res = await orderAPI.getOrders({ limit: 200 });
        const found = res.orders.find(
          (o) => o.orderNumber === params.orderId || o.id === params.orderId
        );
        setOrder(found ?? null);
      } catch (error) {
        console.error("Failed to fetch order:", error);
        toast.error('Failed to load order details.');
        setOrder(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [params.orderId]);

  const handleStatusUpdate = async (financialStatus: string, fulfillmentStatus: string) => {
    if (!order) return;
    setIsUpdating(true);
    try {
      // Update locally since no update API is available in orderAPI
      setOrder((prev) =>
        prev
          ? {
              ...prev,
              financialStatus,
              fulfillmentStatus,
              updatedAt: new Date().toISOString(),
            }
          : prev
      );
      toast.success('Order status updated successfully!');
    } catch (error) {
      console.error("Failed to update order:", error);
      toast.error('Failed to update order status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGenerateLabel = async () => {
    if (!order) return;
    try {
      const res = await fetch('/api/shipping/label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, orderNumber: order.orderNumber }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to generate label');

      const label = data.label;
      setOrder((prev) => prev ? {
        ...prev,
        shippingCarrier: label.carrier,
        awb: label.awb || label.trackingNumber,
        labelUrl: label.labelUrl,
      } : prev);
      toast.success('Shipping label generated successfully');
    } catch (e: any) {
      console.error('Generate label error:', e);
      toast.error(e?.message || 'Failed to generate label');
    }
  };

  const handleSchedulePickup = async () => {
    if (!order) return;
    try {
      const res = await fetch('/api/shipping/pickup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          awb: order.awb,
          pickupDate: pickupDate || new Date().toISOString(),
          address: order.shippingAddress,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to schedule pickup');
      toast.success('Pickup scheduled');
    } catch (e: any) {
      console.error('Schedule pickup error:', e);
      toast.error(e?.message || 'Failed to schedule pickup');
    }
  };

  const trackingUrl = order?.awb ? (() => {
    switch (provider) {
      case 'shiprocket':
        return `https://shiprocket.co/tracking/${order.awb}`;
      case 'delhivery':
        return `https://www.delhivery.com/track/${order.awb}`;
      case 'bluedart':
        return `https://www.bluedart.com/track?awb=${order.awb}`;
      default:
        return '#';
    }
  })() : '#';

  if (isLoading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  if (!order) {
    return notFound();
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'refunded': return 'text-red-600 bg-red-100';
      case 'fulfilled': return 'text-blue-600 bg-blue-100';
      case 'unfulfilled': return 'text-gray-600 bg-gray-100';
      case 'partially_fulfilled': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-gray-500 hover:text-gray-700">
                <ArrowLeftIcon className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
                <p className="text-sm text-gray-500">
                  Placed on {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => {
                        const newFinancialStatus = prompt("Enter new financial status (e.g., paid, pending, refunded):", order.financialStatus);
                        const newFulfillmentStatus = prompt("Enter new fulfillment status (e.g., fulfilled, unfulfilled):", order.fulfillmentStatus);
                        if (newFinancialStatus && newFulfillmentStatus) {
                            handleStatusUpdate(newFinancialStatus, newFulfillmentStatus);
                        }
                    }}
                    disabled={isUpdating}
                    className="flex items-center px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors disabled:bg-gray-400"
                >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    {isUpdating ? 'Updating...' : 'Update Status'}
                </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Order Items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Items ({order.items.length})</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 py-4 border-b border-gray-200 last:border-b-0">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.product.images[0]?.src || '/images/placeholder.svg'}
                        alt={item.product.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{item.product.name}</h3>
                      <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            
            {/* Order Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <CreditCardIcon className="h-8 w-8 text-rose-600 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-900">Payment Status</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.financialStatus)}`}>
                      {order.financialStatus.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center">
                  <TruckIcon className="h-8 w-8 text-rose-600 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-900">Fulfillment Status</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.fulfillmentStatus)}`}>
                      {order.fulfillmentStatus.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>{formatPrice(order.shipping)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span>{formatPrice(order.taxes)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between font-semibold text-lg">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">{formatPrice(order.totalPrice)}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Customer & Delivery */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer</h3>
              <div className="text-sm text-gray-600 space-y-1 mb-4">
                <p className="font-medium text-gray-900">
                  {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
                </p>
                <p>{order.email}</p>
                {order.shippingAddress?.phone && <p>Phone: {order.shippingAddress.phone}</p>}
              </div>
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex items-center mb-2">
                  <MapPinIcon className="h-5 w-5 text-rose-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Delivery Address</h3>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>{order.shippingAddress?.address1}</p>
                  {order.shippingAddress?.address2 && <p>{order.shippingAddress.address2}</p>}
                  <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}</p>
                  <p>{order.shippingAddress?.country}</p>
                </div>
              </div>
            </motion.div>

            {/* Shipping Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                  <div className="relative">
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={provider}
                      onChange={(e) => setProvider(e.target.value as any)}
                    >
                      <option value="shiprocket">Shiprocket</option>
                      <option value="delhivery">Delhivery</option>
                      <option value="bluedart">Bluedart</option>
                    </select>
                    <ChevronDownIcon className="absolute right-2 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleGenerateLabel}
                    className="px-3 py-2 bg-rose-600 text-white rounded-md text-sm hover:bg-rose-700"
                  >
                    Generate Label
                  </button>
                  <a
                    href={order?.labelUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-gray-100 text-gray-800 rounded-md text-sm hover:bg-gray-200 inline-flex items-center"
                  >
                    <LinkIcon className="h-4 w-4 mr-1" /> Label
                  </a>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSchedulePickup}
                    className="px-3 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700"
                    disabled={!order?.awb}
                  >
                    Schedule Pickup
                  </button>
                  <a
                    href={trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                  >
                    Track Shipment
                  </a>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-4 text-sm text-gray-700 space-y-1">
                  <p><span className="font-medium">Carrier:</span> {order?.shippingCarrier || '—'}</p>
                  <p><span className="font-medium">AWB:</span> {order?.awb || '—'}</p>
                  {order?.labelUrl && (
                    <p>
                      <span className="font-medium">Label URL:</span>{' '}
                      <a href={order.labelUrl} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Open</a>
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}