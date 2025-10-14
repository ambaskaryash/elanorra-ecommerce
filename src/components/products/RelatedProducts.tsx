'use client';

import { motion } from 'framer-motion';
import ProductCard from '@/components/ui/ProductCard';
import { products } from '@/lib/data/mock-data';
import { Product } from '@/types';
import { ApiProduct } from '@/lib/services/api';

interface RelatedProductsProps {
  product: Product;
  limit?: number;
}

export default function RelatedProducts({ product, limit = 4 }: RelatedProductsProps) {
  const toApiProduct = (p: Product): ApiProduct => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    category: p.category,
    tags: Array.isArray(p.tags) ? p.tags : [],
    inStock: p.inStock,
    inventory: p.inventory,
    weight: p.weight,
    dimensions: p.dimensions,
    avgRating: 0,
    reviewCount: 0,
    images: (p.images || []).map((img, idx) => ({
      id: img.id,
      src: img.src,
      alt: img.alt,
      position: typeof img.position === 'number' ? img.position : idx + 1,
    })),
    variants: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const relatedProducts: ApiProduct[] = products
    .filter((p) => p.id !== product.id)
    .map((p) => ({
      product: p,
      score:
        (p.category === product.category ? 2 : 0) +
        (Array.isArray(p.tags) && Array.isArray(product.tags)
          ? p.tags.filter((t) => product.tags.includes(t)).length
          : 0),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => toApiProduct(entry.product));

  if (relatedProducts.length === 0) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="mt-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Related Products</h2>
      </div>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {relatedProducts.map((rp) => (
          <motion.div key={rp.id} variants={itemVariants}>
            <ProductCard product={rp} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}