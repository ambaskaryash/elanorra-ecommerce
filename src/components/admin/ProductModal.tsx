'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { productAPI, type ApiProduct } from '@/lib/services/api';
import toast from 'react-hot-toast';
import ImageUpload from './ImageUpload';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: ApiProduct | null;
  onSuccess: () => void;
}

interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  price: string;
  compareAtPrice: string;
  category: string;
  tags: string;
  inStock: boolean;
  inventory: string;
  weight: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
  };
  images: string[];
  variants: Array<{
    name: string;
    value: string;
    priceAdjustment: string;
    inStock: boolean;
    inventory: string;
  }>;
}

const categories = [
  'sofas',
  'chairs', 
  'tables',
  'bedroom',
  'dining',
  'storage',
  'lighting',
  'decor',
  'office',
];

export default function ProductModal({ isOpen, onClose, product, onSuccess }: ProductModalProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    slug: '',
    description: '',
    price: '',
    compareAtPrice: '',
    category: '',
    tags: '',
    inStock: true,
    inventory: '0',
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: '',
    },
    images: [],
    variants: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditMode = !!product;

  // Reset form when modal opens/closes or product changes
  useEffect(() => {
    if (isOpen && product) {
      // Edit mode - populate form with existing data
      setFormData({
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price.toString(),
        compareAtPrice: product.compareAtPrice?.toString() || '',
        category: product.category,
        tags: product.tags.join(', '),
        inStock: product.inStock,
        inventory: product.inventory.toString(),
        weight: product.weight?.toString() || '',
        dimensions: {
          length: product.dimensions?.length.toString() || '',
          width: product.dimensions?.width.toString() || '',
          height: product.dimensions?.height.toString() || '',
        },
        images: product.images.length > 0 ? product.images.map(img => img.src) : [],
        variants: product.variants.map(variant => ({
          name: variant.name,
          value: variant.value,
          priceAdjustment: variant.priceAdjustment.toString(),
          inStock: variant.inStock,
          inventory: variant.inventory.toString(),
        })),
      });
    } else if (isOpen && !product) {
      // Add mode - reset form
      setFormData({
        name: '',
        slug: '',
        description: '',
        price: '',
        compareAtPrice: '',
        category: '',
        tags: '',
        inStock: true,
        inventory: '0',
        weight: '',
        dimensions: {
          length: '',
          width: '',
          height: '',
        },
        images: [],
        variants: [],
      });
    }
    setErrors({});
  }, [isOpen, product]);

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim(),
    }));
  };

  const handleImagesChange = (images: string[]) => {
    setFormData(prev => ({
      ...prev,
      images,
    }));
  };

  const addVariantField = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, {
        name: '',
        value: '',
        priceAdjustment: '0',
        inStock: true,
        inventory: '0',
      }],
    }));
  };

  const removeVariantField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const updateVariantField = (index: number, field: keyof ProductFormData['variants'][0], value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => 
        i === index ? { ...variant, [field]: value } : variant
      ),
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.slug.trim()) newErrors.slug = 'Slug is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.inventory || parseInt(formData.inventory) < 0) newErrors.inventory = 'Valid inventory is required';

    // Validate images
    if (formData.images.length === 0) {
      newErrors.images = 'At least one image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data for API
      const productData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        price: parseFloat(formData.price),
        compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : undefined,
        category: formData.category,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        inStock: formData.inStock,
        inventory: parseInt(formData.inventory),
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        dimensions: (formData.dimensions.length && formData.dimensions.width && formData.dimensions.height) ? {
          length: parseFloat(formData.dimensions.length),
          width: parseFloat(formData.dimensions.width),
          height: parseFloat(formData.dimensions.height),
        } : undefined,
        images: formData.images
          .map((src, index) => ({
            id: `temp-${index}`, // Temporary ID for new images
            src,
            alt: formData.name,
            position: index,
          })),
        variants: formData.variants
          .filter(variant => variant.name.trim() && variant.value.trim())
          .map((variant, index) => ({
            id: `temp-variant-${index}`, // Temporary ID for new variants
            name: variant.name,
            value: variant.value,
            priceAdjustment: parseFloat(variant.priceAdjustment) || 0,
            inStock: variant.inStock,
            inventory: parseInt(variant.inventory) || 0,
          })),
      };

      if (isEditMode && product) {
        // Update existing product
        await productAPI.updateProduct(product.slug, productData);
        toast.success('Product updated successfully!');
      } else {
        // Create new product
        await productAPI.createProduct(productData);
        toast.success('Product created successfully!');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-3xl bg-white text-left align-middle shadow-2xl transition-all border border-gray-100">
                {/* Header with gradient background */}
                <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <div>
                        <Dialog.Title className="text-xl font-bold text-white">
                          {isEditMode ? 'Edit Product' : 'Add New Product'}
                        </Dialog.Title>
                        <p className="text-rose-100 text-sm mt-1">
                          {isEditMode ? 'Update product details below' : 'Fill in the details to create a new product'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="p-2 rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                      onClick={onClose}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Content with padding */}
                <div className="px-8 py-6">

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Basic Information */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-rose-100 rounded-lg">
                          <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                      </div>
                      <div className="space-y-5">
                      
                        <div className="group">
                          <label className="block text-sm font-semibold text-gray-800 mb-2">Product Name *</label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm transition-all duration-200 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 group-hover:border-gray-300"
                            placeholder="Enter product name"
                            required
                          />
                          {errors.name && <p className="mt-2 text-sm text-red-500 flex items-center"><span className="mr-1">⚠️</span>{errors.name}</p>}
                        </div>

                        <div className="group">
                          <label className="block text-sm font-semibold text-gray-800 mb-2">URL Slug *</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={formData.slug}
                              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                              className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 pr-12 text-sm transition-all duration-200 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 group-hover:border-gray-300"
                              placeholder="auto-generated-slug"
                              required
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                            </div>
                          </div>
                          {errors.slug && <p className="mt-2 text-sm text-red-500 flex items-center"><span className="mr-1">⚠️</span>{errors.slug}</p>}
                        </div>

                        <div className="group">
                          <label className="block text-sm font-semibold text-gray-800 mb-2">Category *</label>
                          <div className="relative">
                            <select
                              value={formData.category}
                              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                              className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm transition-all duration-200 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 appearance-none"
                              required
                            >
                              <option value="">Select a category</option>
                              {categories.map(category => (
                                <option key={category} value={category}>
                                  {category.charAt(0).toUpperCase() + category.slice(1)}
                                </option>
                              ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                          {errors.category && <p className="mt-2 text-sm text-red-500 flex items-center"><span className="mr-1">⚠️</span>{errors.category}</p>}
                        </div>

                        <div className="group">
                          <label className="block text-sm font-semibold text-gray-800 mb-2">Description *</label>
                          <textarea
                            rows={4}
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm transition-all duration-200 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 resize-none"
                            placeholder="Describe your product in detail"
                            required
                          />
                          {errors.description && <p className="mt-2 text-sm text-red-500 flex items-center"><span className="mr-1">⚠️</span>{errors.description}</p>}
                        </div>

                        <div className="group">
                          <label className="block text-sm font-semibold text-gray-800 mb-2">Tags</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={formData.tags}
                              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                              placeholder="modern, luxury, comfortable"
                              className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 pr-12 text-sm transition-all duration-200 focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                            </div>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">Separate multiple tags with commas</p>
                        </div>
                      </div>
                    </div>

                    {/* Pricing & Inventory */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 border border-blue-200 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Pricing & Inventory</h3>
                      </div>
                      <div className="space-y-5">
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.price}
                            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm"
                            required
                          />
                          {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Compare At Price (₹)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.compareAtPrice}
                            onChange={(e) => setFormData(prev => ({ ...prev, compareAtPrice: e.target.value }))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Inventory</label>
                          <input
                            type="number"
                            value={formData.inventory}
                            onChange={(e) => setFormData(prev => ({ ...prev, inventory: e.target.value }))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm"
                            required
                          />
                          {errors.inventory && <p className="mt-1 text-sm text-red-600">{errors.inventory}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={formData.weight}
                            onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm"
                          />
                        </div>
                      </div>

                      <div className="flex items-center">
                        <input
                          id="inStock"
                          type="checkbox"
                          checked={formData.inStock}
                          onChange={(e) => setFormData(prev => ({ ...prev, inStock: e.target.checked }))}
                          className="h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                        />
                        <label htmlFor="inStock" className="ml-2 block text-sm text-gray-900">
                          In Stock
                        </label>
                      </div>

                      {/* Dimensions */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Dimensions (cm)</label>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="number"
                            step="0.1"
                            placeholder="Length"
                            value={formData.dimensions.length}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              dimensions: { ...prev.dimensions, length: e.target.value }
                            }))}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm"
                          />
                          <input
                            type="number"
                            step="0.1"
                            placeholder="Width"
                            value={formData.dimensions.width}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              dimensions: { ...prev.dimensions, width: e.target.value }
                            }))}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm"
                          />
                          <input
                            type="number"
                            step="0.1"
                            placeholder="Height"
                            value={formData.dimensions.height}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              dimensions: { ...prev.dimensions, height: e.target.value }
                            }))}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  </div>

                  {/* Images */}
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-100 rounded-2xl p-6 border border-emerald-200 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Product Images *</h3>
                    </div>
                    
                    <ImageUpload 
                      images={formData.images}
                      onImagesChange={handleImagesChange}
                      maxImages={5}
                    />
                    {errors.images && <p className="mt-4 text-sm text-red-600 flex items-center"><span className="mr-1">⚠️</span>{errors.images}</p>}
                  </div>

                  {/* Variants */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-md font-medium text-gray-900">Product Variants (Optional)</h3>
                      <button
                        type="button"
                        onClick={addVariantField}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-rose-700 bg-rose-100 hover:bg-rose-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                      >
                        Add Variant
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {formData.variants.map((variant, index) => (
                        <div key={index} className="grid grid-cols-12 gap-3 items-center">
                          <div className="col-span-2">
                            <input
                              type="text"
                              placeholder="Name (e.g., Color)"
                              value={variant.name}
                              onChange={(e) => updateVariantField(index, 'name', e.target.value)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm"
                            />
                          </div>
                          <div className="col-span-3">
                            <input
                              type="text"
                              placeholder="Value (e.g., Red)"
                              value={variant.value}
                              onChange={(e) => updateVariantField(index, 'value', e.target.value)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Price adj."
                              value={variant.priceAdjustment}
                              onChange={(e) => updateVariantField(index, 'priceAdjustment', e.target.value)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="number"
                              placeholder="Inventory"
                              value={variant.inventory}
                              onChange={(e) => updateVariantField(index, 'inventory', e.target.value)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={variant.inStock}
                                onChange={(e) => updateVariantField(index, 'inStock', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                              />
                              <span className="ml-1 text-sm text-gray-700">In Stock</span>
                            </label>
                          </div>
                          <div className="col-span-1">
                            <button
                              type="button"
                              onClick={() => removeVariantField(index)}
                              className="inline-flex items-center px-2 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-between items-center pt-8 border-t-2 border-gray-100">
                    <div className="text-sm text-gray-500">
                      {isEditMode ? 'Update existing product details' : 'All required fields must be filled'}
                    </div>
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex items-center px-6 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center px-8 py-3 text-sm font-bold text-white bg-gradient-to-r from-rose-600 to-pink-600 border border-transparent rounded-xl hover:from-rose-700 hover:to-pink-700 focus:outline-none focus:ring-4 focus:ring-rose-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isEditMode ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M12 4v16m8-8H4"} />
                            </svg>
                            {isEditMode ? 'Update Product' : 'Create Product'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}