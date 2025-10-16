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
import { Product } from '@/types';
import { toast } from 'react-hot-toast';
import ProductReviews from '@/components/ui/ProductReviews';
import RelatedProducts from '@/components/products/RelatedProducts';
import FrequentlyBoughtTogether from '@/components/products/FrequentlyBoughtTogether';
import ProductVariants from '@/components/ui/ProductVariants';
import ImageZoom from '@/components/ui/ImageZoom';
import { ApiProduct } from '@/lib/services/api';

interface ProductPageClientProps {
  product: Product;
  canonicalUrl: string;
}

export default function ProductPageClient({ product, canonicalUrl }: ProductPageClientProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [variantPriceAdjustment, setVariantPriceAdjustment] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<{ [key: string]: string }>({});

  const { addItem } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();

  const isWishlisted = isInWishlist(product?.id || '');

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
    avgRating: product.avgRating || 0, // Use stored average rating
    reviewCount: product.reviewCount || 0, // Use stored review count
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
    const productVariants = (mockVariants as any)[product.id];
    if (productVariants) {
      Object.entries(variants).forEach(([variantType, selectedValue]) => {
        const variantOptions = (productVariants as any)[variantType];
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

  const rating = product.avgRating || 0;
  const reviewCount = product.reviewCount || 0;

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
              (reviewCount > 0 && rating > 0)
                ? {
                    '@type': 'AggregateRating',
                    ratingValue: Number(rating.toFixed(1)),
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
              <ImageZoom
                src={product.images[selectedImage]?.src || '/images/placeholder.jpg'}
                alt={product.images[selectedImage]?.alt || product.name}
                className="absolute inset-0"
                priority
              />

              {/* Badges */}
              <div className="absolute top-4 left-4 space-y-2 z-10">
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
                    Save {product.compareAtPrice - product.price} INR
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail Images */}
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((img, idx) => (
                <button
                  key={img.id}
                  className={`relative aspect-square rounded-xl overflow-hidden border ${selectedImage === idx ? 'border-rose-600' : 'border-gray-200'}`}
                  onClick={() => setSelectedImage(idx)}
                >
                  <Image src={img.src} alt={img.alt} fill className="object-cover" />
                </button>
              ))}
            </div>
          </motion.div>

          {/* Product Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                  <p className="mt-2 text-gray-600">{product.shortDescription || product.description}</p>
                </div>
                <button
                  onClick={handleWishlist}
                  className="p-2 rounded-full border hover:bg-gray-50"
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  {isWishlisted ? (
                    <HeartIconSolid className="h-6 w-6 text-rose-600" />
                  ) : (
                    <HeartIcon className="h-6 w-6 text-gray-700" />
                  )}
                </button>
              </div>

              {/* Ratings */}
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[0,1,2,3,4].map((i) => (
                    i < Math.round((rating as number) || 0) ? (
                      <StarIconSolid key={i} className="h-5 w-5 text-yellow-400" />
                    ) : (
                      <StarIcon key={i} className="h-5 w-5 text-gray-300" />
                    )
                  ))}
                </div>
                <span className="text-gray-600">{typeof rating === 'number' ? rating.toFixed(1) : 'N/A'} ({reviewCount} reviews)</span>
                <button onClick={handleShare} className="ml-auto p-2 rounded-full border hover:bg-gray-50" aria-label="Share product">
                  <ShareIcon className="h-5 w-5 text-gray-700" />
                </button>
              </div>

              {/* Price */}
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-gray-900">₹{(product.price + variantPriceAdjustment).toLocaleString('en-IN')}</span>
                {product.compareAtPrice && (
                  <span className="text-lg text-gray-500 line-through">₹{product.compareAtPrice.toLocaleString('en-IN')}</span>
                )}
              </div>

              {/* Variants */}
              <ProductVariants productId={product.id} onVariantChange={handleVariantChange} />

              {/* Quantity Selector */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Quantity</span>
                <div className="flex items-center border rounded-lg overflow-hidden">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    className="p-2 hover:bg-gray-50"
                    aria-label="Decrease quantity"
                  >
                    <MinusIcon className="h-5 w-5" />
                  </button>
                  <span className="px-6 py-2">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    className="p-2 hover:bg-gray-50"
                    aria-label="Increase quantity"
                  >
                    <PlusIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Add to Cart */}
              <div className="flex gap-4">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-rose-600 text-white py-3 px-6 rounded-lg hover:bg-rose-700 font-semibold"
                >
                  Add to Cart
                </button>
                <button
                  onClick={handleShare}
                  className="p-3 border rounded-lg hover:bg-gray-50"
                  aria-label="Share product"
                >
                  <ShareIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Shipping & Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Shipping</h3>
                  <p className="text-sm text-gray-600">Ships within 3-5 business days</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Returns</h3>
                  <p className="text-sm text-gray-600">Easy returns within 7 days</p>
                </div>
              </div>

              {/* Description */}
              <div className="prose max-w-none">
                <h2 className="text-xl font-semibold">About this product</h2>
                <p className="text-gray-700 mt-2">{product.description}</p>
                {product.dimensions && (
                  <div className="mt-4 text-sm text-gray-600">
                    <p>Dimensions: {product.dimensions.length} x {product.dimensions.width} x {product.dimensions.height} cm</p>
                    {product.weight && <p>Weight: {product.weight} g</p>}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Related Products */}
        <RelatedProducts product={product} />

        {/* Frequently Bought Together */}
        <FrequentlyBoughtTogether product={product} />

        {/* Reviews Section */}
        <div className="mt-12">
          <ProductReviews productId={product.id} productName={product.name} />
        </div>
      </div>
    </div>
  );
}
