'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import HeroCarousel from '@/components/sections/HeroCarousel';
import FeaturedCollections from '@/components/sections/FeaturedCollections';
import FeaturedProducts from '@/components/sections/FeaturedProducts';

export default function Home() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'admin_access_denied') {
      toast.error('Access denied: You don\'t have permission to access the admin dashboard.', {
        duration: 5000,
        position: 'top-center',
      });
    }
  }, [searchParams]);

  return (
    <div>
      {/* Hero Section */}
      <HeroCarousel />
      
      {/* Featured Collections */}
      <FeaturedCollections />
      
      {/* Featured Products */}
      <FeaturedProducts />
      
      {/* Additional sections can be added here */}
    </div>
  );
}
