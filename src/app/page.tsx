import HeroCarousel from '@/components/sections/HeroCarousel';
import FeaturedCollections from '@/components/sections/FeaturedCollections';
import FeaturedProducts from '@/components/sections/FeaturedProducts';

export default function Home() {
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
