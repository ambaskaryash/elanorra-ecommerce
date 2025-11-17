'use client';

import { api, ApiOrder } from '@/lib/services/api';
import { formatPrice } from '@/lib/utils/index';
import { ArrowRightIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getShippingProvider } from '@/lib/services/shipping';

const getFinancialStatusColor = (status: string) => {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'refunded':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getFulfillmentStatusColor = (status: string) => {
  switch (status) {
    case 'fulfilled':
      return 'bg-blue-100 text-blue-800';
    case 'unfulfilled':
      return 'bg-amber-100 text-amber-800';
    case 'partially-fulfilled':
        return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};


export default function OrderHistoryPage() {
  const { user, isLoaded } = useUser();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      try {
        const response = await api.orders.getOrders({ userId: user.id });
        if (response.orders) {
          setOrders(response.orders);
        } else {
          toast.error('Failed to fetch orders.');
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast.error('An error occurred while fetching your orders.');
      } finally {
        setIsLoading(false);
      }
    };

    if (user && isLoaded) {
      fetchOrders();
    }
  }, [user, isLoaded]);

  return (
    <div className="bg-white">
      <main className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl">
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">Order History</h1>
            <p className="mt-2 text-sm text-gray-500">
                Check the status of recent orders, manage returns, and discover similar products.
            </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-12"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
            </div>
          ) : orders.length > 0 ? (
            <div className="space-y-8">
              {orders.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-6 bg-gray-50/50">
                  <div className="md:flex md:items-center md:justify-between">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-gray-900">Order #{order.orderNumber}</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Placed on <time dateTime={order.createdAt}>{new Date(order.createdAt).toLocaleDateString()}</time>
                      </p>
                    </div>
                    <div className="mt-4 flex items-center md:mt-0 md:ml-4">
                        <Link href={`/order-confirmation/${order.id}`} className="text-rose-600 hover:text-rose-500 font-medium flex items-center">
                            View Details
                            <ArrowRightIcon className="ml-2 h-4 w-4" />
                        </Link>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flow-root">
                        <div className="-my-6 divide-y divide-gray-200">
                            {order.items.map((item) => (
                                <div key={item.id} className="py-6 flex items-center">
                                    <Image
                                        src={item.product.images?.[0]?.src || '/placeholder.svg'}
                                        alt={item.product.images?.[0]?.alt || item.product.name}
                                        width={80}
                                        height={80}
                                        className="rounded-md object-cover"
                                    />
                                    <div className="ml-4 flex-1">
                                        <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 mt-6 pt-6 sm:flex sm:items-center sm:justify-between">
                      <div>
                          <p className="font-medium text-gray-900">Total: {formatPrice(order.totalPrice)}</p>
                      </div>
                      <div className="mt-2 sm:mt-0 flex items-center space-x-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getFinancialStatusColor(order.financialStatus)}`}>{order.financialStatus}</span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getFulfillmentStatusColor(order.fulfillmentStatus)}`}>{order.fulfillmentStatus}</span>
                        {/* Tracking link if available */}
                        {order.shippingCarrier && (order.awb || order.labelUrl) && (
                          <Link
                            href={order.awb ? getShippingProvider(order.shippingCarrier as any).getTrackingUrl(order.awb) : order.labelUrl!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
                          >
                            {order.awb ? 'Track Shipment' : 'Download Label'}
                          </Link>
                        )}
                        {/* Invoice download / view */}
                        <Link
                          href={`/account/orders/${order.id}/invoice`}
                          className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
                        >
                          View Invoice
                        </Link>
                        {/* Initiate return */}
                        <Link
                          href={`/account/returns/new?orderId=${order.id}`}
                          className="px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800 hover:bg-rose-200"
                        >
                          Start Return
                        </Link>
                      </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 border-2 border-dashed border-gray-300 rounded-lg">
              <ShoppingBagIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-600 mb-6">You haven&apos;t placed any orders with us yet.</p>
              <Link href="/shop" className="inline-flex items-center px-6 py-3 bg-rose-600 text-white font-medium rounded-md hover:bg-rose-700 transition-colors">
                Start Shopping
              </Link>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}