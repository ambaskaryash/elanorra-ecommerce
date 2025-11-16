"use client";
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, ApiProduct } from '@/lib/services/api';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';

export default function PublicWishlistPage() {
  const sp = useSearchParams();
  const idsParam = sp.get('ids');
  const ids = idsParam ? idsParam.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const [items, setItems] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ids.length) return;
    setLoading(true);
    setError(null);
    api.products
      .getProducts({ ids })
      .then((res) => setItems(res.products))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load wishlist'))
      .finally(() => setLoading(false));
  }, [idsParam]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Shared Wishlist</h1>
          <p className="text-gray-600">View and compare saved products</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {loading && <div className="text-gray-500">Loading…</div>}
        {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {!loading && items.length === 0 && (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-gray-600">No products to show.</p>
            <p className="mt-2 text-sm text-gray-500">Ask the sender to share a valid wishlist link.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <Link href={`/products/${product.slug}`}>
                <div className="relative aspect-square">
                  <Image src={product.images[0]?.src || '/images/placeholder.svg'} alt={product.name} fill className="object-cover" />
                </div>
              </Link>
              <div className="p-4">
                <Link href={`/products/${product.slug}`} className="font-medium text-gray-900 hover:text-rose-600">
                  {product.name}
                </Link>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-lg font-bold">{formatPrice(product.price)}</span>
                  {product.compareAtPrice && product.compareAtPrice > product.price && (
                    <span className="text-sm text-gray-500 line-through">{formatPrice(product.compareAtPrice)}</span>
                  )}
                </div>
                <div className="mt-2 text-sm text-gray-500">{product.category}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}