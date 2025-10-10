'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { StarIcon, HeartIcon, ShareIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid, HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { useCartStore } from '@/lib/store/cart-store';
import { useWishlistStore } from '@/lib/store/wishlist-store';
import { useReviewsStore } from '@/lib/store/reviews-store';
import { products } from '@/lib/data/mock-data';
import { Product } from '@/types';
import { toast } from 'react-hot-toast';
import ProductReviews from '@/components/ui/ProductReviews';
import ProductVariants from '@/components/ui/ProductVariants';

interface Props {
  params: {
    slug: string;
  };
}

export default function ProductPage({ params }: Props) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [variantPriceAdjustment, setVariantPriceAdjustment] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<{ [key: string]: string }>({});
  
  const { addItem } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { getProductRating } = useReviewsStore();

  // Find the product by slug
  const product = products.find(p => p.slug === params.slug);
  
  const isWishlisted = isInWishlist(product?.id || '');
  const { averageRating, totalReviews } = getProductRating(product?.id || '');

  if (!product) {
    notFound();
  }

  const handleAddToCart = () => {
    // Create a modified product with variant information
    const productWithVariants = {
      ...product,
      price: product.price + variantPriceAdjustment,
      selectedVariants, // Include selected variants info
    };
    addItem(productWithVariants, quantity);
    toast.success(`${product.name} added to cart!`);
  };

  const handleVariantChange = (variants: { [key: string]: string }) => {
    setSelectedVariants(variants);
    // Calculate price adjustment based on variants
    // This would be more complex in a real app with proper variant pricing
    const mockVariants = {
      '1': {
        size: [{ value: 'small', price: 0 }, { value: 'medium', price: 200 }, { value: 'large', price: 400 }],
        color: [{ value: 'white', price: 0 }, { value: 'blue', price: 100 }, { value: 'green', price: 100 }, { value: 'pink', price: 150 }]
      },
      '2': {
        size: [{ value: '6inch', price: 0 }, { value: '8inch', price: 300 }, { value: '10inch', price: 600 }],
        material: [{ value: 'ceramic', price: 0 }, { value: 'bone-china', price: 800 }]
      }
    };
    
    let adjustment = 0;
    const productVariants = mockVariants[product.id as keyof typeof mockVariants];
    if (productVariants) {
      Object.entries(variants).forEach(([variantType, selectedValue]) => {
        const variantOptions = productVariants[variantType as keyof typeof productVariants];
        if (variantOptions) {
          const option = variantOptions.find((opt: any) => opt.value === selectedValue);
          if (option) adjustment += option.price;
        }
      });
    }
    setVariantPriceAdjustment(adjustment);
  };

  const handleWishlist = () => {
    if (product) {
      toggleWishlist(product);
      toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
    }
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, Math.min(product.inventory, quantity + delta));
    setQuantity(newQuantity);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.shortDescription || product.description,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      toast.success('Product URL copied to clipboard!');
    }
  };

  // Use real rating data from reviews
  const rating = averageRating;
  const reviewCount = totalReviews;

  return (
    <div className="min-h-screen bg-white">
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
                src={product.images[selectedImage]?.src || '/placeholder-product.jpg'}
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
                  <span className="inline-block px-3 py-1 bg-red-600 text-white text-sm font-medium rounded-full">
                    Sale
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail Images */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-square rounded-lg overflow-hidden ${
                      selectedImage === index ? 'ring-2 ring-rose-500' : 'ring-1 ring-gray-200'
                    }`}
                  >
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 25vw, (max-width: 1200px) 15vw, 10vw"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              
              {/* Rating */}
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(rating)
                          ? 'text-yellow-400 fill-current'
                          : i < rating
                          ? 'text-yellow-400 fill-current opacity-50'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {rating} ({reviewCount} reviews)
                </span>
              </div>

              {/* Price */}
              <div className="flex items-center space-x-4 mb-6">
                <span className="text-3xl font-bold text-gray-900">
                  ₹{(product.price + variantPriceAdjustment).toLocaleString()}
                </span>
                {variantPriceAdjustment > 0 && (
                  <span className="text-lg text-gray-600">
                    (base: ₹{product.price.toLocaleString()})
                  </span>
                )}
                {product.compareAtPrice && (
                  <span className="text-xl text-gray-500 line-through">
                    ₹{(product.compareAtPrice + variantPriceAdjustment).toLocaleString()}
                  </span>
                )}
                {product.compareAtPrice && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-sm font-medium rounded">
                    Save ₹{((product.compareAtPrice + variantPriceAdjustment) - (product.price + variantPriceAdjustment)).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-gray-600 leading-relaxed">
                {product.shortDescription || product.description}
              </p>
            </div>

            {/* Product Variants */}
            <ProductVariants 
              productId={product.id} 
              onVariantChange={handleVariantChange}
              className="mb-6"
            />

            {/* Stock Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${product.inStock ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className={`text-sm font-medium ${product.inStock ? 'text-green-700' : 'text-red-700'}`}>
                {product.inStock ? `In Stock (${product.inventory} available)` : 'Out of Stock'}
              </span>
            </div>

            {/* Quantity & Actions */}
            <div className="space-y-4">
              {/* Quantity Selector */}
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Quantity:</label>
                <div className="flex items-center border border-gray-300 rounded-md">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    className="p-2 hover:bg-gray-50 transition-colors"
                    disabled={quantity <= 1}
                  >
                    <MinusIcon className="h-4 w-4" />
                  </button>
                  <span className="px-4 py-2 font-medium">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    className="p-2 hover:bg-gray-50 transition-colors"
                    disabled={quantity >= product.inventory}
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className="flex-1 bg-rose-600 text-white px-8 py-3 rounded-md font-medium hover:bg-rose-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                </button>
                
                <button
                  onClick={handleWishlist}
                  className="p-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  {isWishlisted ? (
                    <HeartIconSolid className="h-6 w-6 text-red-500" />
                  ) : (
                    <HeartIcon className="h-6 w-6" />
                  )}
                </button>
                
                <button
                  onClick={handleShare}
                  className="p-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <ShareIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Product Details */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium capitalize">{product.category}</span>
                </div>
                {product.subcategory && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subcategory:</span>
                    <span className="font-medium capitalize">{product.subcategory}</span>
                  </div>
                )}
                {product.weight && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Weight:</span>
                    <span className="font-medium">{product.weight}g</span>
                  </div>
                )}
                {product.dimensions && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dimensions:</span>
                    <span className="font-medium">
                      {product.dimensions.length} × {product.dimensions.width} × {product.dimensions.height} cm
                    </span>
                  </div>
                )}
              </div>
              
              {/* Tags */}
              {product.tags.length > 0 && (
                <div className="mt-4">
                  <span className="text-sm text-gray-600 mb-2 block">Tags:</span>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Full Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16 max-w-4xl"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">About This Product</h2>
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 leading-relaxed text-lg">
              {product.description}
            </p>
          </div>
        </motion.div>

        {/* Reviews Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Customer Reviews</h2>
          <ProductReviews productId={product.id} productName={product.name} />
        </motion.div>

        {/* Related Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-8">You May Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products
              .filter(p => p.id !== product.id && p.category === product.category)
              .slice(0, 4)
              .map((relatedProduct) => (
                <Link key={relatedProduct.id} href={`/products/${relatedProduct.slug}`}>
                  <div className="group cursor-pointer">
                    <div className="relative aspect-square mb-3 bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={relatedProduct.images[0]?.src || '/placeholder-product.jpg'}
                        alt={relatedProduct.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                      />
                    </div>
                    <h3 className="font-medium text-gray-900 mb-1 group-hover:text-rose-600 transition-colors">
                      {relatedProduct.name}
                    </h3>
                    <p className="text-gray-600 font-medium">₹{relatedProduct.price.toLocaleString()}</p>
                  </div>
                </Link>
              ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}