'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import Head from 'next/head';
import Script from 'next/script';
import { StarIcon, HeartIcon, ShareIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid, HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { useCartStore } from '@/lib/store/cart-store';
import { useWishlistStore } from '@/lib/store/wishlist-store';
import { useReviewsStore } from '@/lib/store/reviews-store';
import ProductReviews from '@/components/ui/ProductReviews';
import ProductVariants from '@/components/ui/ProductVariants';
import { ApiProduct } from '@/lib/services/api';
import { Product } from '@/types';
import { toast } from 'react-hot-toast';

interface ProductClientProps {
  product: Product;
  canonicalUrl: string;
}

export default function ProductClient({ product, canonicalUrl }: ProductClientProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [variantPriceAdjustment, setVariantPriceAdjustment] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<{ [key: string]: string }>({});

  const { addItem } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { getProductRating } = useReviewsStore();

  const isWishlisted = isInWishlist(product?.id || '');
  const { averageRating, totalReviews } = getProductRating(product?.id || '');

  // Build ApiProduct shape for cart/wishlist stores
  const apiProductBase: ApiProduct = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    category: product.category,
    tags: product.tags || [],
    inStock: product.inStock,
    inventory: product.inventory,
    weight: product.weight,
    dimensions: product.dimensions,
    avgRating: typeof averageRating === 'number' ? averageRating : 0,
    reviewCount: typeof totalReviews === 'number' ? totalReviews : 0,
    images: product.images.map((img, idx) => ({
      id: img.id,
      src: img.src,
      alt: img.alt,
      position: typeof img.position === 'number' ? img.position : idx + 1,
    })),
    variants: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const handleAddToCart = () => {
    const selectedVariantEntries = Object.entries(selectedVariants).map(([key, value], index) => ({
      id: `${product.id}-var-${index + 1}`,
      name: key,
      value,
      priceAdjustment: variantPriceAdjustment,
      inStock: product.inStock,
      inventory: product.inventory,
    }));

    const apiProductForCart: ApiProduct = {
      ...apiProductBase,
      price: apiProductBase.price + variantPriceAdjustment,
      variants: selectedVariantEntries,
      updatedAt: new Date().toISOString(),
    };

    addItem(apiProductForCart, quantity);
    toast.success(`${product.name} added to cart!`);
  };

  const handleVariantChange = (variants: { [key: string]: string }) => {
    setSelectedVariants(variants);
    const mockVariants = {
      '1': {
        size: [{ value: 'small', price: 0 }, { value: 'medium', price: 200 }, { value: 'large', price: 400 }],
        color: [{ value: 'white', price: 0 }, { value: 'blue', price: 100 }, { value: 'green', price: 100 }, { value: 'pink', price: 150 }]
      },
      '2': {
        size: [{ value: '6inch', price: 0 }, { value: '8inch', price: 300 }, { value: '10inch', price: 600 }],
        material: [{ value: 'ceramic', price: 0 }, { value: 'bone-china', price: 800 }]
      }
    } as const;

    let adjustment = 0;
    const productVariants = (mockVariants as Record<string, any>)[product.id];
    if (productVariants) {
      Object.entries(variants).forEach(([variantType, selectedValue]) => {
        const variantOptions = productVariants[variantType];
        if (variantOptions) {
          const option = variantOptions.find((opt: any) => opt.value === selectedValue);
          if (option) adjustment += option.price;
        }
      });
    }
    setVariantPriceAdjustment(adjustment);
  };

  const handleWishlist = () => {
    toggleWishlist(apiProductBase);
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, Math.min(product.inventory, quantity + delta));
    setQuantity(newQuantity);
  };

  const handleShare = async () => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      const nav = window.navigator as Navigator & {
        share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
        clipboard?: Clipboard;
      };
      if (typeof nav.share === 'function') {
        try {
          await nav.share({
            title: product.name,
            text: product.shortDescription || product.description,
            url,
          });
          return;
        } catch {
          // ignore share errors
        }
      }
      if (nav.clipboard && typeof nav.clipboard.writeText === 'function') {
        try {
          await nav.clipboard.writeText(url);
          toast.success('Product URL copied to clipboard!');
          return;
        } catch {
          // ignore clipboard errors
        }
      }
    }
    toast.success('Sharing not supported in this environment.');
  };

  const rating = averageRating;
  const reviewCount = totalReviews;

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <link rel="canonical" href={canonicalUrl} />
      </Head>
      <Script
        id="product-jsonld"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: product.shortDescription || product.description,
            image: product.images.map((img) => img.src),
            sku: product.id,
            brand: {
              '@type': 'Brand',
              name: (process.env.NEXT_PUBLIC_SITE_NAME || 'Brand'),
            },
            category: product.category,
            offers: {
              '@type': 'Offer',
              url: canonicalUrl,
              priceCurrency: 'INR',
              price: product.price + variantPriceAdjustment,
              availability: product.inStock
                ? 'http://schema.org/InStock'
                : 'http://schema.org/OutOfStock',
            },
            aggregateRating:
              (typeof reviewCount === 'number' && reviewCount > 0 && typeof rating === 'number')
                ? {
                    '@type': 'AggregateRating',
                    ratingValue: Number((rating as number).toFixed(1)),
                    reviewCount,
                  }
                : undefined,
          }),
        }}
      />

      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li><Link href="/" className="hover:text-gray-700">Home</Link></li>
              <li>/</li>
              <li><Link href="/shop" className="hover:text-gray-700">Shop</Link></li>
              <li>/</li>
              <li className="text-gray-900 font-medium">{product.name}</li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Main Image */}
            <div className="relative aspect-square mb-4 bg-gray-100 rounded-2xl overflow-hidden">
              <Image
            src={product.images[selectedImage]?.src || '/images/placeholder.svg'}
                alt={product.images[selectedImage]?.alt || product.name}
                fill
                className="object-cover"
                priority
              />

              {/* Badges */}
              <div className="absolute top-4 left-4 space-y-2">
                {product.newArrival && (
                  <span className="inline-block px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-full">
                    New
                  </span>
                )}
                {product.bestseller && (
                  <span className="inline-block px-3 py-1 bg-rose-600 text-white text-sm font-medium rounded-full">
                    Bestseller
                  </span>
                )}
                {product.compareAtPrice && (
                  <span className="inline-block px-3 py-1 bg-green-600 text-white text-sm font-medium rounded-full">
                    Sale
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImage(index)}
                  className={`relative aspect-square rounded-lg overflow-hidden border ${selectedImage === index ? 'border-rose-600' : 'border-gray-200'}`}
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </motion.div>

          {/* Product Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            {/* Title and Rating */}
            <div>
              <div className="flex items-start justify-between">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{product.name}</h1>
                <button
                  onClick={handleWishlist}
                  className="ml-4 p-2 rounded-full border border-gray-200 hover:border-rose-600 hover:text-rose-600 transition-colors"
                  aria-label="Toggle wishlist"
                >
                  {isWishlisted ? (
                    <HeartIconSolid className="w-6 h-6 text-rose-600" />
                  ) : (
                    <HeartIcon className="w-6 h-6" />
                  )}
                </button>
              </div>

              {/* Rating */}
              <div className="mt-2 flex items-center">
                <div className="flex items-center">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span key={i} className="inline-block">
                      {i < Math.round((rating as number) || 0) ? (
                        <StarIconSolid className="h-5 w-5 text-yellow-400" />
                      ) : (
                        <StarIcon className="h-5 w-5 text-gray-300" />
                      )}
                    </span>
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-500">{reviewCount} reviews</span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center space-x-3">
              <div className="text-2xl font-bold text-gray-900">₹{(product.price + variantPriceAdjustment).toLocaleString('en-IN')}</div>
              {product.compareAtPrice && (
                <div className="text-lg text-gray-500 line-through">₹{product.compareAtPrice.toLocaleString('en-IN')}</div>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600">{product.description}</p>

            {/* Variants */}
            <ProductVariants productId={product.id} onVariantChange={handleVariantChange} />

            {/* Quantity and Actions */}
            <div className="flex items-center space-x-4">
              {/* Quantity */}
              <div className="flex items-center border rounded-lg overflow-hidden">
                <button onClick={() => handleQuantityChange(-1)} className="p-2 hover:bg-gray-50" aria-label="Decrease quantity">
                  <MinusIcon className="w-5 h-5" />
                </button>
                <div className="px-4 py-2 border-x text-center w-12">{quantity}</div>
                <button onClick={() => handleQuantityChange(1)} className="p-2 hover:bg-gray-50" aria-label="Increase quantity">
                  <PlusIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-rose-600 text-white px-6 py-3 rounded-lg hover:bg-rose-700 transition-colors"
              >
                Add to Cart
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                className="p-3 rounded-lg border border-gray-200 hover:border-gray-300"
                aria-label="Share product"
              >
                <ShareIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Stock Status */}
            <div className="text-sm text-gray-600">
              {product.inStock ? (
                <span className="text-green-600 font-medium">In stock</span>
              ) : (
                <span className="text-red-600 font-medium">Out of stock</span>
              )}
            </div>

            {/* Collections and Tags */}
            <div className="pt-4 border-t">
              <div className="text-sm text-gray-600">
                <span>Category: </span>
                <Link href={`/shop/${product.category}`} className="text-rose-600 hover:underline">
                  {product.category}
                </Link>
              </div>
              {product.tags?.length > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  <span>Tags: </span>
                  {product.tags.map((tag, idx) => (
                    <span key={tag}>
                      <Link href={`/shop/tags/${tag}`} className="text-rose-600 hover:underline">{tag}</Link>
                      {idx < product.tags.length - 1 && ', '}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Reviews */}
        <div className="mt-12">
          <ProductReviews productId={product.id} productName={product.name} />
        </div>
      </div>
    </div>
  );
}