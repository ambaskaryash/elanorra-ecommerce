'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, cubicBezier } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image';
// Hero Slides Data
const heroSlides = [
  {
    id: '1',
    title: 'Handcrafted with Love',
    subtitle: 'Exquisite ceramic tableware and bespoke gifting solutions',
    buttonText: 'Shop Tableware',
    buttonLink: '/shop?category=tableware',
    image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=1600&h=900&fit=crop&crop=center',
  },
  {
    id: '2',
    title: 'Curated Collections',
    subtitle: 'From Anaar to Vasant - Discover stories in every piece',
    buttonText: 'Explore Collections',
    buttonLink: '/collections',
    image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=1600&h=900&fit=crop&crop=center',
  },
  {
    id: '3',
    title: 'Bespoke Gifting',
    subtitle: 'Custom gifting solutions for your special moments',
    buttonText: 'Gift Sets',
    buttonLink: '/shop?category=gifting',
    image: 'https://images.unsplash.com/photo-1607344645866-009c7d0f2e4b?w=1600&h=900&fit=crop&crop=center',
  },
  {
    id: '4',
    title: 'For Adults & Kids',
    subtitle: 'Beautiful designs that cater to the whole family',
    buttonText: 'Kids Collection',
    buttonLink: '/collections/kids-victoria',
    image: 'https://images.unsplash.com/photo-1585129777188-94600ff10dd6?w=1600&h=900&fit=crop&crop=center',
  },
];

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [erroredSlides, setErroredSlides] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000); // Resume autoplay after 10 seconds
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  return (
    <section className="relative h-[85vh] overflow-hidden bg-stone-50">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: cubicBezier(0.16, 1, 0.3, 1) }}
          className="absolute inset-0"
        >
          {/* Background Image */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent z-10" />
          <Image
            src={erroredSlides[currentSlide] ? '/images/placeholder.jpg' : heroSlides[currentSlide].image}
            alt={heroSlides[currentSlide].title}
            fill
            className="object-cover opacity-90"
            priority
            sizes="100vw"
            onError={() => setErroredSlides(prev => ({ ...prev, [currentSlide]: true }))}
          />

          {/* Content */}
          <div className="relative z-20 h-full flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <div className="max-w-3xl">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-4xl sm:text-5xl lg:text-7xl font-light text-white mb-6 leading-tight tracking-wide"
                >
                  {heroSlides[currentSlide].title}
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-xl sm:text-2xl text-white/95 mb-10 leading-relaxed font-light"
                >
                  {heroSlides[currentSlide].subtitle}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  <Link
                    href={heroSlides[currentSlide].buttonLink}
                    className="inline-block bg-transparent border-2 border-white text-white px-10 py-4 text-lg font-light hover:bg-white hover:text-gray-900 transition-all duration-300 tracking-wide uppercase"
                  >
                    {heroSlides[currentSlide].buttonText}
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows - Minimalist Style */}
      <button
        onClick={prevSlide}
        className="absolute left-6 top-1/2 -translate-y-1/2 z-30 bg-black/20 backdrop-blur-sm hover:bg-black/40 text-white p-3 transition-all duration-300"
        aria-label="Previous slide"
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-30 bg-black/20 backdrop-blur-sm hover:bg-black/40 text-white p-3 transition-all duration-300"
        aria-label="Next slide"
      >
        <ChevronRightIcon className="h-5 w-5" />
      </button>

      {/* Slide Indicators - Clean Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex space-x-2">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 transition-all duration-300 ${
              index === currentSlide
                ? 'bg-white w-8'
                : 'bg-white/60 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}