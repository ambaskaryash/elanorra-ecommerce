'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckIcon } from '@heroicons/react/24/outline';
import { ProductVariant } from '@/types';

interface ProductVariantsProps {
  productId: string;
  onVariantChange?: (variants: { [key: string]: string }) => void;
  className?: string;
}

// Mock variant data - in a real app this would come from the product data or API
interface VariantOption {
  id: string;
  name: string;
  value: string;
  price: number;
}

interface VariantGroup {
  [key: string]: VariantOption[];
}

const mockVariants: Record<string, VariantGroup> = {
  '1': {
    size: [
      { id: 'size-small', name: 'Small (150ml)', value: 'small', price: 0 },
      { id: 'size-medium', name: 'Medium (250ml)', value: 'medium', price: 200 },
      { id: 'size-large', name: 'Large (350ml)', value: 'large', price: 400 },
    ],
    color: [
      { id: 'color-white', name: 'Cream White', value: 'white', price: 0 },
      { id: 'color-blue', name: 'Ocean Blue', value: 'blue', price: 100 },
      { id: 'color-green', name: 'Sage Green', value: 'green', price: 100 },
      { id: 'color-pink', name: 'Blush Pink', value: 'pink', price: 150 },
    ],
  },
  '2': {
    size: [
      { id: 'size-6inch', name: '6 inch', value: '6inch', price: 0 },
      { id: 'size-8inch', name: '8 inch', value: '8inch', price: 300 },
      { id: 'size-10inch', name: '10 inch', value: '10inch', price: 600 },
    ],
    material: [
      { id: 'material-ceramic', name: 'Ceramic', value: 'ceramic', price: 0 },
      { id: 'material-bone-china', name: 'Bone China', value: 'bone-china', price: 800 },
    ],
  },
};

const colorMap = {
  white: '#F8F9FA',
  blue: '#4A90E2',
  green: '#7ED321',
  pink: '#F5A1C2',
} as const;

export default function ProductVariants({ productId, onVariantChange, className = '' }: ProductVariantsProps) {
  const [selectedVariants, setSelectedVariants] = useState<{ [key: string]: string }>({});
  const [totalPriceChange, setTotalPriceChange] = useState(0);

  const variants = mockVariants[productId];

  // Initialize with first option of each variant type
  useEffect(() => {
    if (variants) {
      const initialVariants: { [key: string]: string } = {};
      Object.entries(variants).forEach(([variantType, options]) => {
        if (options.length > 0) {
          initialVariants[variantType] = options[0].value;
        }
      });
      setSelectedVariants(initialVariants);
    }
  }, [variants, productId]);

  // Calculate price change when variants change
  useEffect(() => {
    if (variants) {
      let priceChange = 0;
      Object.entries(selectedVariants).forEach(([variantType, selectedValue]) => {
        const variantOptions = variants[variantType];
        if (variantOptions) {
          const selectedOption = variantOptions.find((option: VariantOption) => option.value === selectedValue);
          if (selectedOption) {
            priceChange += selectedOption.price;
          }
        }
      });
      setTotalPriceChange(priceChange);
      
      // Notify parent component
      onVariantChange?.(selectedVariants);
    }
  }, [selectedVariants, variants, onVariantChange]);

  const handleVariantSelect = (variantType: string, value: string) => {
    setSelectedVariants(prev => ({
      ...prev,
      [variantType]: value,
    }));
  };

  if (!variants) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {Object.entries(variants).map(([variantType, options]) => (
        <div key={variantType}>
          <h4 className="text-sm font-medium text-gray-900 mb-3 capitalize">
            {variantType}
            {selectedVariants[variantType] && (
              <span className="ml-2 text-gray-600 font-normal">
                ({options.find(opt => opt.value === selectedVariants[variantType])?.name})
              </span>
            )}
          </h4>

          {/* Color variants - show as color swatches */}
          {variantType === 'color' && (
            <div className="flex items-center space-x-3">
              {options.map((option: VariantOption) => (
                <motion.button
                  key={option.id}
                  onClick={() => handleVariantSelect(variantType, option.value)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative w-8 h-8 rounded-full border-2 transition-all ${
                    selectedVariants[variantType] === option.value
                      ? 'border-gray-900 ring-2 ring-gray-900 ring-offset-2'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ 
                    backgroundColor: colorMap[option.value as keyof typeof colorMap] || '#F8F9FA' 
                  }}
                  title={`${option.name}${option.price > 0 ? ` (+₹${option.price})` : ''}`}
                >
                  {selectedVariants[variantType] === option.value && (
                    <CheckIcon className="absolute inset-0 m-auto h-4 w-4 text-gray-900" />
                  )}
                </motion.button>
              ))}
            </div>
          )}

          {/* Size and Material variants - show as buttons */}
          {variantType !== 'color' && (
            <div className="flex flex-wrap gap-3">
              {options.map((option: VariantOption) => (
                <motion.button
                  key={option.id}
                  onClick={() => handleVariantSelect(variantType, option.value)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`px-4 py-2 border rounded-md text-sm font-medium transition-all ${
                    selectedVariants[variantType] === option.value
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span>{option.name}</span>
                    {option.price > 0 && (
                      <span className="text-xs opacity-75 mt-1">+₹{option.price}</span>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Price adjustment summary */}
      {totalPriceChange > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md p-3"
        >
          <span className="text-sm text-blue-800 font-medium">
            Variant upgrades
          </span>
          <span className="text-sm text-blue-800 font-bold">
            +₹{totalPriceChange}
          </span>
        </motion.div>
      )}

      {/* Variant details */}
      <div className="text-xs text-gray-500 space-y-1">
        {Object.entries(selectedVariants).map(([variantType, selectedValue]) => {
          const option = variants[variantType]?.find(
            (opt: VariantOption) => opt.value === selectedValue
          );
          if (!option) return null;
          
          return (
            <div key={variantType} className="flex justify-between">
              <span className="capitalize">{variantType}:</span>
              <span>{option.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}