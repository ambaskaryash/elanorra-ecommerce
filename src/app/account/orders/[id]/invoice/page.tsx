import React from 'react';
import { api, ApiOrder } from '@/lib/services/api';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function fetchOrder(id: string): Promise<ApiOrder | null> {
  try {
    // Fallback: fetch user orders is not possible server-side without userId; try generic list and filter
    // If the API supports filtering by id via query, try that first
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/orders?id=${id}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const orders: ApiOrder[] = data.orders || [];
      const match = orders.find(o => o.id === id);
      return match || null;
    }
  } catch {}
  return null;
}

export default async function InvoicePage({ params }: { params: { id: string } }) {
  const order = await fetchOrder(params.id);

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-xl font-semibold">Invoice</h1>
        <p className="mt-2 text-gray-600">Unable to load order invoice.</p>
        <Link href="/account/orders" className="mt-4 inline-block text-indigo-600">Back to orders</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Invoice #{order.orderNumber}</h1>
        <button onClick={() => window.print()} className="px-4 py-2 rounded bg-indigo-600 text-white">Print</button>
      </div>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold">Billing Address</h2>
          <p className="text-sm text-gray-700 mt-1">
            {order.billingAddress?.firstName} {order.billingAddress?.lastName}<br/>
            {order.billingAddress?.address1}{order.billingAddress?.address2 ? `, ${order.billingAddress.address2}` : ''}<br/>
            {order.billingAddress?.city}, {order.billingAddress?.state} {order.billingAddress?.zipCode}<br/>
            {order.billingAddress?.country}
          </p>
        </div>
        <div>
          <h2 className="font-semibold">Shipping Address</h2>
          <p className="text-sm text-gray-700 mt-1">
            {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}<br/>
            {order.shippingAddress?.address1}{order.shippingAddress?.address2 ? `, ${order.shippingAddress.address2}` : ''}<br/>
            {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}<br/>
            {order.shippingAddress?.country}
          </p>
        </div>
      </div>

      <div className="mt-6 border-t border-gray-200 pt-6">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="text-left py-2">Item</th>
              <th className="text-right py-2">Qty</th>
              <th className="text-right py-2">Price</th>
              <th className="text-right py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="py-2">{item.product.name}</td>
                <td className="py-2 text-right">{item.quantity}</td>
                <td className="py-2 text-right">{formatPrice(item.price)}</td>
                <td className="py-2 text-right">{formatPrice(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end">
        <div className="text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
          <div className="flex justify-between"><span>Taxes</span><span>{formatPrice(order.taxes)}</span></div>
          <div className="flex justify-between"><span>Shipping</span><span>{formatPrice(order.shipping)}</span></div>
          {order.discount > 0 && (<div className="flex justify-between"><span>Discount</span><span>-{formatPrice(order.discount)}</span></div>)}
          <div className="flex justify-between font-semibold mt-2"><span>Total</span><span>{formatPrice(order.totalPrice)}</span></div>
        </div>
      </div>

      <div className="mt-8 print:hidden">
        <Link href="/account/orders" className="text-indigo-600">Back to orders</Link>
      </div>
    </div>
  );
}