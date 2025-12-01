'use client';

import React from 'react';
import { formatPrice } from '@/lib/utils';

export interface InvoiceItem {
  name: string;
  description?: string;
  quantity: number;
  price: number;
  sku?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  orderNumber: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address: Address;
  };
  billingAddress: Address;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  taxes: number;
  totalPrice: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  notes?: string;
  couponCode?: string;
}

interface InvoiceTemplateProps {
  invoiceData: InvoiceData;
  invoiceNumber: string;
  invoiceDate: string;
}

export const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({
  invoiceData,
  invoiceNumber,
  invoiceDate,
}) => {
  const {
    orderNumber,
    customerInfo,
    billingAddress,
    items,
    subtotal,
    discount,
    shipping,
    taxes,
    totalPrice,
    currency,
    paymentMethod,
    paymentStatus,
    couponCode,
  } = invoiceData;

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 shadow-lg" id="invoice-template">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">E</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Elanorra Living</h1>
            <p className="text-gray-600">Premium Home Decor & Furniture</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">INVOICE</h2>
          <p className="text-gray-600">Invoice #: {invoiceNumber}</p>
          <p className="text-gray-600">Date: {invoiceDate}</p>
          <p className="text-gray-600">Order #: {orderNumber}</p>
        </div>
      </div>

      {/* Company Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">From:</h3>
          <div className="text-gray-700">
            <p className="font-semibold">Elanorra Living Pvt. Ltd.</p>
            <p>123 Design Street</p>
            <p>Bangalore, Karnataka 560001</p>
            <p>India</p>
            <p className="mt-2">
              <span className="font-medium">Email:</span> info@elanorraliving.in
            </p>
            <p>
              <span className="font-medium">Phone:</span> +91 80 1234 5678
            </p>
            <p>
              <span className="font-medium">GST:</span> 29ABCDE1234F1Z5
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Bill To:</h3>
          <div className="text-gray-700">
            <p className="font-semibold">{customerInfo.name}</p>
            <p>{billingAddress.street}</p>
            <p>
              {billingAddress.city}, {billingAddress.state} {billingAddress.postalCode}
            </p>
            <p>{billingAddress.country}</p>
            {customerInfo.phone && (
              <p className="mt-2">
                <span className="font-medium">Phone:</span> {customerInfo.phone}
              </p>
            )}
            <p>
              <span className="font-medium">Email:</span> {customerInfo.email}
            </p>
          </div>
        </div>
      </div>

      {/* Shipping Address (if different from billing) */}
      {JSON.stringify(customerInfo.address) !== JSON.stringify(billingAddress) && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Ship To:</h3>
          <div className="text-gray-700">
            <p className="font-semibold">{customerInfo.name}</p>
            <p>{customerInfo.address.street}</p>
            <p>
              {customerInfo.address.city}, {customerInfo.address.state} {customerInfo.address.postalCode}
            </p>
            <p>{customerInfo.address.country}</p>
            {customerInfo.phone && (
              <p className="mt-2">
                <span className="font-medium">Phone:</span> {customerInfo.phone}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Items Table */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Items Ordered:</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">
                  Item
                </th>
                <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-900">
                  Quantity
                </th>
                <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-900">
                  Unit Price
                </th>
                <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-900">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      {item.description && (
                        <p className="text-sm text-gray-600">{item.description}</p>
                      )}
                      {item.sku && (
                        <p className="text-xs text-gray-500 mt-1">SKU: {item.sku}</p>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center">
                    {item.quantity}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-right">
                    {formatPrice(item.price, { currency: currency as 'INR' | 'USD' })}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-right font-medium">
                    {formatPrice(item.price * item.quantity, { currency: currency as 'INR' | 'USD' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-full max-w-sm">
          <div className="space-y-2">
            <div className="flex justify-between py-2">
              <span className="text-gray-700">Subtotal:</span>
              <span className="font-medium">{formatPrice(subtotal, { currency: currency as 'INR' | 'USD' })}</span>
            </div>
            
            {discount > 0 && (
              <div className="flex justify-between py-2 text-green-600">
                <span>
                  Discount {couponCode && `(${couponCode})`}:
                </span>
                <span className="font-medium">-{formatPrice(discount, { currency: currency as 'INR' | 'USD' })}</span>
              </div>
            )}
            
            <div className="flex justify-between py-2">
              <span className="text-gray-700">Shipping:</span>
              <span className="font-medium">
                {shipping === 0 ? 'Free' : formatPrice(shipping, { currency: currency as 'INR' | 'USD' })}
              </span>
            </div>
            
            <div className="flex justify-between py-2">
              <span className="text-gray-700">Tax (GST):</span>
              <span className="font-medium">{formatPrice(taxes, { currency: currency as 'INR' | 'USD' })}</span>
            </div>
            
            <div className="border-t border-gray-300 pt-2">
              <div className="flex justify-between py-2">
                <span className="text-lg font-semibold text-gray-900">Total:</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatPrice(totalPrice, { currency: currency as 'INR' | 'USD' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Information */}
      {paymentMethod && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Information:</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700">
              <span className="font-medium">Payment Method:</span> {paymentMethod}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Status:</span> {paymentStatus}
            </p>
            <p className="text-green-600 font-medium mt-2">✓ Payment Confirmed</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-300 pt-8 mt-8">
        <div className="text-center text-gray-600">
          <p className="mb-2">Thank you for your business!</p>
          <p className="text-sm">
            For any questions regarding this invoice, please contact us at{' '}
            <a href="mailto:info@elanorraliving.in" className="text-purple-600 hover:underline">
              info@elanorraliving.in
            </a>
          </p>
          <p className="text-sm mt-2">
            Visit us at{' '}
            <a href="https://elanorraliving.in" className="text-purple-600 hover:underline">
              www.elanorraliving.in
            </a>
          </p>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="mt-8 text-xs text-gray-500">
        <h4 className="font-semibold mb-2">Terms & Conditions:</h4>
        <ul className="space-y-1">
          <li>• All sales are final unless otherwise specified in our return policy.</li>
          <li>• Delivery times are estimates and may vary based on location and availability.</li>
          <li>• For returns and exchanges, please contact us within 7 days of delivery.</li>
          <li>• This invoice is computer generated and does not require a signature.</li>
        </ul>
      </div>
    </div>
  );
};

export default InvoiceTemplate;