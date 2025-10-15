'use client';

import { api, ApiOrder } from '@/lib/services/api';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function NewReturnRequestPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);
  const [selectedItems, setSelectedItems] = useState<{[itemId: string]: number}>({});
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchOrders() {
      if (!session) return;
      try {
        const userOrders = await api.orders.getOrders();
        setOrders(userOrders.orders.filter((order: ApiOrder) => order.fulfillmentStatus === 'fulfilled'));
      } catch (err) {
        toast.error('Failed to fetch orders.');
      }
    }

    fetchOrders();
  }, [session]);

  const handleItemQuantityChange = (itemId: string, quantity: number) => {
    setSelectedItems(prev => ({ ...prev, [itemId]: quantity }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || Object.keys(selectedItems).length === 0 || !reason) {
      toast.error('Please fill out all fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.returns.createReturnRequest({
        orderId: selectedOrder.id,
        reason,
        items: Object.entries(selectedItems).map(([orderItemId, quantity]) => ({ orderItemId, quantity })),
      });
      toast.success('Return request submitted successfully!');
      router.push('/account/returns');
    } catch (err) {
      toast.error('Failed to submit return request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">New Return Request</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="order" className="block text-sm font-medium text-gray-700">Select an Order</label>
          <select
            id="order"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            onChange={(e) => setSelectedOrder(orders.find(o => o.id === e.target.value) || null)}
          >
            <option value="">--Please choose an order--</option>
            {orders.map(order => (
              <option key={order.id} value={order.id}>Order #{order.orderNumber}</option>
            ))}
          </select>
        </div>

        {selectedOrder && (
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">Select Items to Return</h3>
            <div className="space-y-4">
              {selectedOrder.items.map(item => (
                <div key={item.id} className="flex items-center justify-between p-2 border rounded-md">
                  <div>
                    <p className="font-semibold">{item.product.name}</p>
                    <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={item.quantity}
                    className="w-20 text-center border-gray-300 rounded-md"
                    onChange={(e) => handleItemQuantityChange(item.id, parseInt(e.target.value))}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Reason for Return</label>
          <textarea
            id="reason"
            rows={4}
            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Return Request'}
        </button>
      </form>
    </div>
  );
}