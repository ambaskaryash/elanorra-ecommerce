const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'demo';

function buildCloudinaryUrl(path: string, width: number, height: number) {
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_${width},h_${height},c_fill/${path}`;
}

const imageMappings = {
  // Hero Carousel Images
  'ecommerce/hero/vasant-collection_hero1': { width: 1600, height: 900 },
  'ecommerce/hero/anaar-collection_hero2': { width: 1600, height: 900 },
  'ecommerce/hero/gulistan-collection_hero3': { width: 1600, height: 900 },
  'ecommerce/hero/kids-victoria_hero4': { width: 1600, height: 900 },

  // Product Images
  'ecommerce/products/vasant-tea-cup-set': { width: 800, height: 600 },
  'ecommerce/products/anaar-dinner-plates': { width: 800, height: 600 },
  'ecommerce/products/gulistan-serving-set': { width: 800, height: 600 },
  'ecommerce/products/kids-victoria-meal-set': { width: 800, height: 600 },
  'ecommerce/products/kids-victoria-special': { width: 800, height: 600 },
  'ecommerce/products/pondicherry-coastal': { width: 800, height: 600 },
  'ecommerce/products/floral-paradise-notebook': { width: 800, height: 600 },
  'ecommerce/products/sundarbans-coffee-mug': { width: 800, height: 600 },
  'ecommerce/products/vintage-garden-tray': { width: 800, height: 600 },
  'ecommerce/products/gulistan-rose-plates': { width: 800, height: 600 },
  'ecommerce/products/gulistan-tea-set': { width: 800, height: 600 },
  'ecommerce/products/pondicherry-bowls': { width: 800, height: 600 },
  'ecommerce/products/le-jardin-bleu-cups': { width: 800, height: 600 },
  'ecommerce/products/kids-art-supply-box': { width: 800, height: 600 },
  'ecommerce/products/executive-pen-collection': { width: 800, height: 600 },
  'ecommerce/products/garden-bloom-candles': { width: 800, height: 600 },
  'ecommerce/products/vasant-tea-detail-1': { width: 800, height: 600 },

  // Category/Collection Images
  'ecommerce/categories/stationery-category': { width: 600, height: 400 },
  'ecommerce/categories/dining-category': { width: 600, height: 400 },
  'ecommerce/categories/featured-collection': { width: 600, height: 600 },

  // About Page Images
  'ecommerce/team/sarah-mitchell': { width: 400, height: 400 },
  'ecommerce/team/david-chen': { width: 400, height: 400 },
  'ecommerce/team/maya-patel': { width: 400, height: 400 },
  'ecommerce/about/studio-workspace-1': { width: 400, height: 300 },
  'ecommerce/about/studio-workspace-2': { width: 400, height: 400 },
  'ecommerce/about/studio-workspace-3': { width: 400, height: 400 },
  'ecommerce/about/studio-workspace-4': { width: 400, height: 300 },

  // Large banner images
  'ecommerce/banners/about-hero': { width: 1600, height: 900 },
  'ecommerce/banners/about-story': { width: 800, height: 600 },
  'ecommerce/banners/contact-hero': { width: 1600, height: 900 },
};

export const cloudinaryImageMap: Record<string, string> = Object.entries(imageMappings).reduce((acc, [path, dims]) => {
  const originalUrl = `https://res.cloudinary.com/demo/image/upload/w_${dims.width},h_${dims.height},c_fill/${path}`;
  acc[originalUrl] = buildCloudinaryUrl(path, dims.width, dims.height);
  return acc;
}, {} as Record<string, string>);


// Helper function to get Cloudinary URL for an Unsplash URL
export function getCloudinaryUrl(unsplashUrl: string): string {
  return cloudinaryImageMap[unsplashUrl] || unsplashUrl;
}

// Helper function to replace all Unsplash URLs in a text with Cloudinary URLs
export function replaceUnsplashWithCloudinary(text: string): string {
  let result = text;
  Object.entries(cloudinaryImageMap).forEach(([unsplash, cloudinary]) => {
    result = result.replace(new RegExp(unsplash.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), cloudinary);
  });
  return result;
}
