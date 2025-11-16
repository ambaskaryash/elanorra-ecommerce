"use client";
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, ApiProduct } from '@/lib/services/api';
import { useCompareStore } from '@/lib/store/compare-store';
import Link from 'next/link';

export default function ComparePageClient() {
  const searchParams = useSearchParams();
  const idsParam = searchParams.get('ids');
  const idsFromUrl = idsParam ? idsParam.split(',').map((s) => s.trim()).filter(Boolean) : [];

  const { items, add, remove, clear } = useCompareStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const shouldHydrateFromIds = idsFromUrl.length > 0;
    if (!shouldHydrateFromIds) return;

    const currentIds = items.map((p) => p.id);
    const isDifferent =
      currentIds.length !== idsFromUrl.length ||
      currentIds.some((id) => !idsFromUrl.includes(id));
    if (!isDifferent) return;

    setLoading(true);
    setError(null);
    api.products
      .getProducts({ ids: idsFromUrl })
      .then((res) => {
        clear();
        res.products.forEach((p) => add(p));
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load products'))
      .finally(() => setLoading(false));
  }, [idsParam]);

  const shareUrl = useMemo(() => {
    const url = new URL(typeof window !== 'undefined' ? window.location.href : '');
    const ids = items.map((p) => p.id).join(',');
    url.searchParams.set('ids', ids);
    return url.toString();
  }, [items]);

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Shareable compare link copied to clipboard');
    } catch {
      alert('Unable to copy link');
    }
  };

  const fields: Array<{ key: keyof ApiProduct | 'finalPrice' | 'dimensionsText' | 'availability'; label: string }> = [
    { key: 'name', label: 'Product' },
    { key: 'category', label: 'Category' },
    { key: 'finalPrice', label: 'Price' },
    { key: 'compareAtPrice', label: 'MRP' },
    { key: 'avgRating', label: 'Rating' },
    { key: 'reviewCount', label: 'Reviews' },
    { key: 'weight', label: 'Weight' },
    { key: 'dimensionsText', label: 'Dimensions' },
    { key: 'availability', label: 'Availability' },
    { key: 'tags', label: 'Tags' },
  ];

  const valuesByField = useMemo(() => {
    return fields.map(({ key }) => {
      const values = items.map((p) => valueForKey(p, key));
      const differs = values.some((v) => v !== values[0]);
      return { key, values, differs };
    });
  }, [items]);

  function valueForKey(p: ApiProduct, key: (typeof fields)[number]['key']) {
    switch (key) {
      case 'finalPrice':
        return formatCurrency(p.price);
      case 'dimensionsText':
        return p.dimensions ? `${p.dimensions.length} x ${p.dimensions.width} x ${p.dimensions.height} cm` : '-';
      case 'availability':
        return p.inStock ? 'In Stock' : 'Out of Stock';
      case 'tags':
        return p.tags?.length ? p.tags.join(', ') : '-';
      case 'name':
        return p.name;
      case 'category':
        return p.category;
      case 'compareAtPrice':
        return p.compareAtPrice ? formatCurrency(p.compareAtPrice) : '-';
      case 'avgRating':
        return `${p.avgRating.toFixed(1)}`;
      case 'reviewCount':
        return `${p.reviewCount}`;
      case 'weight':
        return p.weight ? `${p.weight} kg` : '-';
      default:
        // Fallback for keys that map directly
        // @ts-expect-error dynamic access
        return p[key] as string;
    }
  }

  function formatCurrency(n: number) {
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);
    } catch {
      return `₹${n.toFixed(2)}`;
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Compare Products</h1>
        <div className="flex gap-3">
          <button
            onClick={copyShareLink}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            disabled={items.length === 0}
            aria-disabled={items.length === 0}
            title={items.length === 0 ? 'Add items to compare first' : 'Copy shareable compare link'}
          >
            Copy Share Link
          </button>
          <button
            onClick={() => clear()}
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Clear
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      {loading && (
        <div className="mt-4 text-sm text-gray-500">Loading products…</div>
      )}

      {items.length === 0 && !loading && (
        <div className="mt-8 rounded-lg border border-dashed p-8 text-center">
          <p className="text-gray-600">No products selected for comparison.</p>
          <p className="mt-2 text-sm text-gray-500">Use the compare toggle on product cards, then come back here.</p>
          <Link href="/products" className="mt-4 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Browse Products</Link>
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-8 overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="w-48 border-b p-3 text-left text-sm font-medium text-gray-500">Spec</th>
                {items.map((p) => (
                  <th key={p.id} className="border-b p-3 text-left">
                    <div className="flex items-center gap-3">
                      <img src={p.images?.[0]?.src} alt={p.images?.[0]?.alt || p.name} className="h-12 w-12 rounded object-cover" />
                      <div>
                        <Link href={`/products/${p.slug}`} className="text-sm font-semibold hover:underline">{p.name}</Link>
                        <div className="mt-1 text-xs text-gray-500">{formatCurrency(p.price)}{p.compareAtPrice ? <span className="ml-2 text-gray-400 line-through">{formatCurrency(p.compareAtPrice)}</span> : null}</div>
                      </div>
                      <button
                        className="ml-auto rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
                        onClick={() => remove(p.id)}
                        aria-label={`Remove ${p.name} from compare`}
                      >
                        Remove
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {valuesByField.map(({ key, values, differs }, rowIdx) => (
                <tr key={String(key)} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="w-48 border-b p-3 text-sm text-gray-600">{fields.find((f) => f.key === key)?.label}</td>
                  {values.map((val, i) => (
                    <td
                      key={i}
                      className={`border-b p-3 text-sm ${differs ? 'bg-yellow-50' : ''}`}
                    >
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-8 rounded-md bg-green-50 p-4 text-sm text-green-700">
          Differences are highlighted. Use share link to send this comparison.
        </div>
      )}
    </div>
  );
}