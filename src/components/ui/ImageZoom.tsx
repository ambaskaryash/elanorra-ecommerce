'use client';

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ImageZoomProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

export default function ImageZoom({ src, alt, className = '', priority = false }: ImageZoomProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  // Ensure the image src is absolute and uses https
  const sanitizeSrc = (raw: string) => {
    if (!raw) return '/images/placeholder.svg';
    // Handle protocol-relative URLs
    if (raw.startsWith('//')) return `https:${raw}`;
    // Force https for cloudinary or http links
    if (raw.startsWith('http://res.cloudinary.com')) {
      return raw.replace('http://', 'https://');
    }
    return raw;
  };
  const safeSrc = hasError ? '/images/placeholder.svg' : sanitizeSrc(src);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setMousePosition({ x, y });
  }, []);

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  const handleClick = () => {
    setIsZoomed(true);
  };

  const handleCloseZoom = () => {
    setIsZoomed(false);
  };

  const handleZoomedImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      {/* Main Image Container */}
      <div
        ref={imageRef}
        className={`relative cursor-zoom-in group ${className}`}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        <Image
          src={safeSrc}
          alt={alt}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover transition-transform duration-300"
          priority={priority}
          onError={() => setHasError(true)}
        />

        {/* Zoom Indicator (no background overlay to avoid black cover) */}
        <div className="pointer-events-none absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-700" />
          </div>
        </div>

        {/* Hover Zoom Effect */}
        {isHovering && (
          <div
            className="absolute inset-0 bg-no-repeat pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              backgroundImage: `url(${safeSrc})`,
              backgroundSize: '200%',
              backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%`,
              borderRadius: 'inherit',
            }}
          />
        )}
      </div>

      {/* Full Screen Zoom Modal */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
            onClick={handleCloseZoom}
          >
            {/* Close Button */}
            <button
              onClick={handleCloseZoom}
              className="absolute top-4 right-4 z-10 bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-2 hover:bg-opacity-30 transition-all duration-200"
            >
              <XMarkIcon className="w-6 h-6 text-white" />
            </button>

            {/* Zoomed Image Container */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="relative max-w-[90vw] max-h-[90vh] w-full h-full"
              onClick={handleZoomedImageClick}
            >
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="relative max-w-full max-h-full">
                  <Image
                    src={safeSrc}
                    alt={alt}
                    width={1200}
                    height={1200}
                    className="object-contain max-w-full max-h-[90vh] w-auto h-auto"
                    priority
                    onError={() => setHasError(true)}
                  />
                </div>
              </div>
            </motion.div>

            {/* Instructions */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-4 py-2">
                <p className="text-white text-sm">Click anywhere to close</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}