'use client';

import { api, ApiReturnRequest } from '@/lib/services/api';
import { useUser } from '@clerk/nextjs';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function ReturnRequestDetailsPage() {
  const { user, isLoaded } = useUser();
  const params = useParams();
  const [returnRequest, setReturnRequest] = useState<ApiReturnRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchReturnRequest() {
      if (!isLoaded || !user || !params.returnId) return;
      try {
        const request = await api.returns.getReturnRequest(params.returnId as string);
        setReturnRequest(request);
      } catch (error) {
        toast.error('Failed to fetch return request details.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchReturnRequest();
  }, [isLoaded, user, params.returnId]);

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (!returnRequest) {
    return <p>Return request not found.</p>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Return Request Details</h2>
      <div className="space-y-4">
        <p><strong>Order Number:</strong> #{returnRequest.order.orderNumber}</p>
        <p><strong>Status:</strong> {returnRequest.status}</p>
        <p><strong>Reason:</strong> {returnRequest.reason}</p>
        <p><strong>Requested on:</strong> {new Date(returnRequest.createdAt).toLocaleDateString()}</p>
        
        <h3 className="text-lg font-medium text-gray-800 mt-6 mb-2">Returned Items</h3>
        <div className="space-y-2">
          {returnRequest.items.map(item => (
            <div key={item.id} className="flex justify-between p-2 border rounded-md">
              <p>{item.orderItem.product.name}</p>
              <p>Quantity: {item.quantity}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}