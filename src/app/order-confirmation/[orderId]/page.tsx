'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { 
  CheckCircleIcon,
  TruckIcon,
  CreditCardIcon,
  MapPinIcon,
  ClockIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { useOrderStore } from '@/lib/store/order-store';
import { formatPrice } from '@/lib/utils';
import { Order } from '@/types';
import { notFound } from 'next/navigation';

interface Props {
  params: {
    orderId: string;
  };
}

export default function OrderConfirmationPage({ params }: Props) {
  const { getOrder } = useOrderStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = () => {
      const foundOrder = getOrder(params.orderId);
      if (foundOrder) {
        setOrder(foundOrder);
      }
      setIsLoading(false);
    };

    fetchOrder();
    
    // Poll for order updates
    const interval = setInterval(fetchOrder, 2000);
    
    return () => clearInterval(interval);
  }, [params.orderId, getOrder]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  if (!order) {
    notFound();
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'fulfilled':
        return 'text-green-600 bg-green-100';
      case 'unfulfilled':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return CheckCircleIcon;
      case 'fulfilled':
        return TruckIcon;
      case 'pending':
        return ClockIcon;
      default:
        return ClockIcon;
    }
  };

  const PaymentStatusIcon = getStatusIcon(order.financialStatus);
  const FulfillmentStatusIcon = getStatusIcon(order.fulfillmentStatus);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
            <p className="text-lg text-gray-600 mb-4">
              Thank you for your order. We've received your purchase and will process it shortly.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 inline-block">
              <p className="text-sm text-gray-500">Order Number</p>
              <p className="text-xl font-bold text-gray-900">{order.orderNumber}</p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Order Status */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white rounded-lg shadow p-6 mb-8"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Status</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <PaymentStatusIcon className="h-8 w-8 text-rose-600 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-900">Payment Status</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.financialStatus)}`}>
                      {order.financialStatus.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <FulfillmentStatusIcon className="h-8 w-8 text-rose-600 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-900">Fulfillment Status</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.fulfillmentStatus)}`}>
                      {order.fulfillmentStatus.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Order Items */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Items</h2>
              
              <div className="space-y-4">
                {order.lineItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 py-4 border-b border-gray-200 last:border-b-0">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.image || '/placeholder-product.jpg'}
                        alt={item.title}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{item.title}</h3>
                      <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatPrice(item.price)} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Order Summary & Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatPrice(order.subtotalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>{formatPrice(order.totalShipping)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span>{formatPrice(order.totalTax)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">{formatPrice(order.totalPrice)}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Delivery Address */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex items-center mb-4">
                <MapPinIcon className="h-5 w-5 text-rose-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Delivery Address</h3>
              </div>
              
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-medium text-gray-900">
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                </p>
                {order.shippingAddress.company && (
                  <p>{order.shippingAddress.company}</p>
                )}
                <p>{order.shippingAddress.address1}</p>
                {order.shippingAddress.address2 && (
                  <p>{order.shippingAddress.address2}</p>
                )}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.zip}
                </p>
                <p>{order.shippingAddress.country}</p>
                {order.shippingAddress.phone && (
                  <p>Phone: {order.shippingAddress.phone}</p>
                )}
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="space-y-3"
            >
              <Link
                href="/shop"
                className="w-full bg-rose-600 text-white py-3 px-4 rounded-md font-medium hover:bg-rose-700 transition-colors text-center block"
              >
                Continue Shopping
              </Link>
              
              <Link
                href="/account/orders"
                className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-md font-medium hover:bg-gray-50 transition-colors text-center block"
              >
                View Order History
              </Link>
              
              <button className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-md font-medium hover:bg-gray-50 transition-colors flex items-center justify-center">
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Download Receipt
              </button>
            </motion.div>
          </div>
        </div>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 bg-blue-50 rounded-lg p-6 text-center"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help?</h3>
          <p className="text-gray-600 mb-4">
            Have questions about your order? Our customer service team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              Contact Support
            </Link>
            <Link
              href="/help"
              className="inline-flex items-center px-4 py-2 bg-white border border-blue-300 text-blue-700 font-medium rounded-md hover:bg-blue-50 transition-colors"
            >
              Visit Help Center
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}