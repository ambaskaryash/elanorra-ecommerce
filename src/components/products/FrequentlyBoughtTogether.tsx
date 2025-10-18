'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { products } from '@/lib/data/mock-data';
import { Product } from '@/types';
import { useCartStore } from '@/lib/store/cart-store';
import { ApiProduct } from '@/lib/services/api';
import { toast } from 'react-hot-toast';

interface FrequentlyBoughtTogetherProps {
  product: Product;
}

// Simple mapping for FBT relationships by slug
const FBT_MAP: Record<string, string[]> = {
  // Example mappings: tweak based on catalog
  'anaar-dinner-set': ['anaar-serving-bowl', 'anaar-salad-plates'],
  'vasant-coffee-mug': ['vasant-dessert-plate', 'vasant-serving-tray'],
};

export default function FrequentlyBoughtTogether({ product }: FrequentlyBoughtTogetherProps) {
  const { addItem } = useCartStore();
  const [selectedSlugs, setSelectedSlugs] = useState<Record<string, boolean>>({});

  const suggestions = useMemo(() => {
    const mapped = FBT_MAP[product.slug] || [];
    let list = products.filter((p) => p.slug !== product.slug && mapped.includes(p.slug));
    if (list.length < 3) {
      // Fallback by category/tags overlap
      const extras = products
        .filter((p) => p.slug !== product.slug)
        .map((p) => ({
          product: p,
          score:
            (p.category === product.category ? 1 : 0) +
            (Array.isArray(p.tags) && Array.isArray(product.tags)
              ? p.tags.filter((t) => product.tags.includes(t)).length
              : 0),
        }))
        .filter((e) => e.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((e) => e.product);
      list = Array.from(new Set([...list, ...extras])).slice(0, 3);
    }
    return list;
  }, [product]);

  if (suggestions.length === 0) return null;

  const totalSelectedPrice = suggestions.reduce((sum, p) => {
    return sum + (selectedSlugs[p.slug] ? p.price : 0);
  }, 0);

  const toggleSelection = (slug: string) => {
    setSelectedSlugs((prev) => ({ ...prev, [slug]: !prev[slug] }));
  };

  const addSelectedToCart = () => {
    const selected = suggestions.filter((p) => selectedSlugs[p.slug]);
    if (selected.length === 0) {
      toast.error('Select at least one item to add.');
      return;
    }
    selected.forEach((p) => {
      const apiProduct: ApiProduct = {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        category: p.category,
        tags: p.tags || [],
        inStock: p.inStock,
        inventory: p.inventory,
        weight: p.weight,
        dimensions: p.dimensions,
        avgRating: 0,
        reviewCount: 0,
        images: p.images.map((img, idx) => ({ id: img.id, src: img.src, alt: img.alt, position: typeof img.position === 'number' ? img.position : idx + 1 })),
        variants: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addItem(apiProduct, 1);
    });
    toast.success('Added selected items to cart.');
  };

  return (
    <div className="mt-16">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Frequently Bought Together</h2>
      <div className="space-y-4">
        {suggestions.map((p) => (
          <div key={p.id} className="flex items-center gap-4 p-3 border rounded-lg">
            <input
              type="checkbox"
              checked={!!selectedSlugs[p.slug]}
              onChange={() => toggleSelection(p.slug)}
              className="h-4 w-4"
            />
            <div className="relative w-16 h-16 rounded-md overflow-hidden">
            <Image src={p.images[0]?.src || '/images/placeholder.svg'} alt={p.images[0]?.alt || p.name} fill className="object-cover" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">{p.name}</div>
              <div className="text-sm text-gray-600">₹{p.price.toLocaleString('en-IN')}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="text-gray-700">
          Selected total: <span className="font-semibold">₹{totalSelectedPrice.toLocaleString('en-IN')}</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={addSelectedToCart}
          className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
        >
          Add Selected to Cart
        </motion.button>
      </div>
    </div>
  );
}