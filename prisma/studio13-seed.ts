import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Studio13 database...');

  // Create Studio13 collections with real data
  const collections = await Promise.all([
    prisma.collection.upsert({
      where: { slug: 'vasant' },
      update: {},
      create: {
        name: 'Vasant',
        slug: 'vasant',
        description: 'Vasant Collection is pure love. Inspired by spring and new beginnings. Each piece celebrates the beauty of renewal and fresh starts.',
        image: 'https://images.unsplash.com/photo-1565362195302-61a3e2fce3f5?w=800&h=600&fit=crop',
      },
    }),
    prisma.collection.upsert({
      where: { slug: 'anaar' },
      update: {},
      create: {
        name: 'Anaar',
        slug: 'anaar',
        description: 'Rich pomegranate-inspired designs that celebrate abundance and prosperity. Deep reds and intricate patterns tell stories of heritage.',
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&h=600&fit=crop',
      },
    }),
    prisma.collection.upsert({
      where: { slug: 'gulistan' },
      update: {},
      create: {
        name: 'Gulistan',
        slug: 'gulistan',
        description: 'Rose garden collection featuring hand-painted floral motifs that celebrate the beauty of nature. Inspired by Mughal gardens.',
        image: 'https://images.unsplash.com/photo-1565362195302-61a3e2fce3f5?w=800&h=600&fit=crop',
      },
    }),
    prisma.collection.upsert({
      where: { slug: 'sundarbans' },
      update: {},
      create: {
        name: 'Sundarbans',
        slug: 'sundarbans',
        description: 'Inspired by the mystical mangrove forests and their natural beauty. Earthy tones and organic patterns.',
        image: 'https://images.unsplash.com/photo-1493936593252-3090dc7e1de4?w=800&h=600&fit=crop',
      },
    }),
    prisma.collection.upsert({
      where: { slug: 'kids-victoria' },
      update: {},
      create: {
        name: 'Kids Victoria',
        slug: 'kids-victoria',
        description: 'Whimsical tableware designed for little dreamers. Safe, durable, and magical designs that inspire imagination.',
        image: 'https://images.unsplash.com/photo-1607734834271-d7c1b5c4e4d1?w=800&h=600&fit=crop',
      },
    }),
    prisma.collection.upsert({
      where: { slug: 'pondicherry' },
      update: {},
      create: {
        name: 'Pondicherry',
        slug: 'pondicherry',
        description: 'French colonial elegance meets Indian craftsmanship in this coastal-inspired collection. Timeless sophistication.',
        image: 'https://images.unsplash.com/photo-1493936593252-3090dc7e1de4?w=800&h=600&fit=crop',
      },
    }),
    prisma.collection.upsert({
      where: { slug: 'le-jardin-bleu' },
      update: {},
      create: {
        name: 'Le Jardin Bleu',
        slug: 'le-jardin-bleu',
        description: 'Blue garden-themed collection with French elegance and delicate floral patterns. Sophisticated and serene.',
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&h=600&fit=crop',
      },
    }),
    prisma.collection.upsert({
      where: { slug: 'vintage-garden' },
      update: {},
      create: {
        name: 'Vintage Garden',
        slug: 'vintage-garden',
        description: 'Classic botanical prints with a vintage charm. Timeless designs that never go out of style.',
        image: 'https://images.unsplash.com/photo-1565362195302-61a3e2fce3f5?w=800&h=600&fit=crop',
      },
    }),
    prisma.collection.upsert({
      where: { slug: 'limited-edition' },
      update: {},
      create: {
        name: 'Limited Edition',
        slug: 'limited-edition',
        description: 'Exclusive collections crafted by master artisans. Available in very limited quantities.',
        image: 'https://images.unsplash.com/photo-1493936593252-3090dc7e1de4?w=800&h=600&fit=crop',
      },
    }),
  ]);

  console.log('✅ Created Studio13 collections');

  // Studio13 Product Data with real images and details
  const studio13Products = [
    // Vasant Collection
    {
      name: 'Vasant Dinner Plate Set (4 pieces)',
      slug: 'vasant-dinner-plate-set',
      description: 'Beautiful dinner plates from our Vasant collection, inspired by spring blossoms. Each plate features delicate floral motifs hand-painted by skilled artisans. Perfect for everyday dining and special occasions.',
      price: 2400,
      compareAtPrice: 3000,
      category: 'tableware',
      tags: ['dinner plates', 'vasant', 'spring', 'floral', 'ceramic'],
      inventory: 25,
      weight: 2.4,
      dimensions: { length: 27, width: 27, height: 2.5 },
      images: [
        {
          src: 'https://images.unsplash.com/photo-1565362195302-61a3e2fce3f5?w=800&h=600&fit=crop',
          alt: 'Vasant Dinner Plate Set - Spring Collection',
          position: 0,
        },
        {
          src: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&h=600&fit=crop',
          alt: 'Vasant Dinner Plate Detail',
          position: 1,
        },
      ],
      variants: [],
      collectionIds: ['vasant'],
    },
    {
      name: 'Vasant Tea Cup & Saucer Set (6 pieces)',
      slug: 'vasant-tea-cup-saucer-set',
      description: 'Elegant tea cups and saucers from the beloved Vasant collection. Perfect for afternoon tea sessions with friends and family. Each piece celebrates the joy of spring with delicate botanical patterns.',
      price: 1800,
      compareAtPrice: 2400,
      category: 'tableware',
      tags: ['tea cups', 'vasant', 'ceramic', 'afternoon tea'],
      inventory: 30,
      weight: 1.8,
      dimensions: { length: 12, width: 12, height: 6 },
      images: [
        {
          src: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&h=600&fit=crop',
          alt: 'Vasant Tea Cup & Saucer Set',
          position: 0,
        },
      ],
      variants: [],
      collectionIds: ['vasant'],
    },

    // Anaar Collection
    {
      name: 'Anaar Large Serving Platter',
      slug: 'anaar-large-serving-platter',
      description: 'Magnificent serving platter from our Anaar collection featuring rich pomegranate motifs. Perfect for festive entertaining and special occasions. The deep red patterns symbolize abundance and prosperity.',
      price: 3200,
      compareAtPrice: 4000,
      category: 'tableware',
      tags: ['serving platter', 'anaar', 'pomegranate', 'entertaining'],
      inventory: 15,
      weight: 2.8,
      dimensions: { length: 35, width: 25, height: 3 },
      images: [
        {
          src: 'https://images.unsplash.com/photo-1493936593252-3090dc7e1de4?w=800&h=600&fit=crop',
          alt: 'Anaar Large Serving Platter',
          position: 0,
        },
        {
          src: 'https://images.unsplash.com/photo-1565362195302-61a3e2fce3f5?w=800&h=600&fit=crop',
          alt: 'Anaar Platter Detail View',
          position: 1,
        },
      ],
      variants: [],
      collectionIds: ['anaar'],
    },
    {
      name: 'Anaar Bowl Set (4 pieces)',
      slug: 'anaar-bowl-set',
      description: 'Beautiful serving bowls featuring the iconic pomegranate design of our Anaar collection. Ideal for serving curries, rice, and other delicious dishes. Each bowl is individually hand-painted.',
      price: 2800,
      category: 'tableware',
      tags: ['bowls', 'anaar', 'serving', 'hand-painted'],
      inventory: 20,
      weight: 2.0,
      dimensions: { length: 20, width: 20, height: 8 },
      images: [
        {
          src: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&h=600&fit=crop',
          alt: 'Anaar Bowl Set',
          position: 0,
        },
      ],
      variants: [],
      collectionIds: ['anaar'],
    },

    // Gulistan Collection
    {
      name: 'Gulistan Rose Garden Dinner Set (20 pieces)',
      slug: 'gulistan-rose-garden-dinner-set',
      description: 'Complete dinner service for four from our romantic Gulistan collection. Includes dinner plates, side plates, bowls, cups, and saucers, all featuring exquisite rose garden motifs inspired by Mughal gardens.',
      price: 8500,
      compareAtPrice: 10500,
      category: 'tableware',
      tags: ['dinner set', 'gulistan', 'rose', 'complete set'],
      inventory: 12,
      weight: 8.5,
      dimensions: { length: 40, width: 30, height: 20 },
      images: [
        {
          src: 'https://images.unsplash.com/photo-1493936593252-3090dc7e1de4?w=800&h=600&fit=crop',
          alt: 'Gulistan Rose Garden Dinner Set',
          position: 0,
        },
        {
          src: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&h=600&fit=crop',
          alt: 'Gulistan Set Individual Pieces',
          position: 1,
        },
      ],
      variants: [],
      collectionIds: ['gulistan'],
    },
    {
      name: 'Gulistan Tea Pot with Infuser',
      slug: 'gulistan-tea-pot-infuser',
      description: 'Elegant ceramic teapot with built-in infuser from the Gulistan collection. Perfect for brewing loose leaf teas while enjoying the beautiful rose garden artwork. Includes matching lid and comfortable handle.',
      price: 2400,
      category: 'tableware',
      tags: ['teapot', 'gulistan', 'infuser', 'ceramic'],
      inventory: 18,
      weight: 1.2,
      dimensions: { length: 22, width: 15, height: 12 },
      images: [
        {
          src: 'https://images.unsplash.com/photo-1565362195302-61a3e2fce3f5?w=800&h=600&fit=crop',
          alt: 'Gulistan Tea Pot with Infuser',
          position: 0,
        },
      ],
      variants: [],
      collectionIds: ['gulistan'],
    },

    // Kids Victoria Collection
    {
      name: 'Kids Victoria Princess Meal Set',
      slug: 'kids-victoria-princess-meal-set',
      description: 'Magical meal set for little princesses featuring castle and fairy tale designs. Includes plate, bowl, and cup with safe, non-toxic materials. Designed to make mealtime fun and encourage independent eating.',
      price: 1500,
      category: 'tableware',
      tags: ['kids', 'princess', 'meal set', 'safe', 'fairy tale'],
      inventory: 35,
      weight: 0.8,
      dimensions: { length: 25, width: 20, height: 8 },
      images: [
        {
          src: 'https://images.unsplash.com/photo-1607734834271-d7c1b5c4e4d1?w=800&h=600&fit=crop',
          alt: 'Kids Victoria Princess Meal Set',
          position: 0,
        },
        {
          src: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&h=600&fit=crop',
          alt: 'Princess Set Individual Pieces',
          position: 1,
        },
      ],
      variants: [],
      collectionIds: ['kids-victoria'],
    },
    {
      name: 'Kids Victoria Adventure Explorer Set',
      slug: 'kids-victoria-adventure-explorer-set',
      description: 'Adventure-themed dining set for young explorers. Features maps, compasses, and treasure hunt motifs. Durable and safe for everyday use, this set sparks imagination during meal times.',
      price: 1600,
      category: 'tableware',
      tags: ['kids', 'adventure', 'explorer', 'durable', 'imagination'],
      inventory: 28,
      weight: 0.9,
      dimensions: { length: 25, width: 20, height: 8 },
      images: [
        {
          src: 'https://images.unsplash.com/photo-1565362195302-61a3e2fce3f5?w=800&h=600&fit=crop',
          alt: 'Kids Victoria Adventure Explorer Set',
          position: 0,
        },
      ],
      variants: [],
      collectionIds: ['kids-victoria'],
    },

    // Sundarbans Collection
    {
      name: 'Sundarbans Forest Mug Collection (4 pieces)',
      slug: 'sundarbans-forest-mug-collection',
      description: 'Beautiful coffee mugs inspired by the mystical Sundarbans forest. Each mug features unique wildlife and mangrove motifs. Perfect for nature lovers who want to bring the wild beauty indoors.',
      price: 1800,
      compareAtPrice: 2200,
      category: 'tableware',
      tags: ['mugs', 'sundarbans', 'forest', 'wildlife', 'nature'],
      inventory: 25,
      weight: 1.6,
      dimensions: { length: 12, width: 9, height: 10 },
      images: [
        {
          src: 'https://images.unsplash.com/photo-1565362195302-61a3e2fce3f5?w=800&h=600&fit=crop',
          alt: 'Sundarbans Forest Mug Collection',
          position: 0,
        },
        {
          src: 'https://images.unsplash.com/photo-1565362195302-61a3e2fce3f5?w=800&h=600&fit=crop',
          alt: 'Individual Sundarbans Mugs',
          position: 1,
        },
      ],
      variants: [],
      collectionIds: ['sundarbans'],
    },

    // Pondicherry Collection
    {
      name: 'Pondicherry Coastal Breakfast Set',
      slug: 'pondicherry-coastal-breakfast-set',
      description: 'Elegant breakfast service inspired by the French colonial charm of Pondicherry. Includes plates, bowls, and cups with subtle coastal motifs. Perfect for leisurely morning meals.',
      price: 3500,
      compareAtPrice: 4200,
      category: 'tableware',
      tags: ['breakfast set', 'pondicherry', 'coastal', 'french colonial'],
      inventory: 20,
      weight: 3.2,
      dimensions: { length: 30, width: 25, height: 15 },
      images: [
        {
          src: 'https://images.unsplash.com/photo-1565362195302-61a3e2fce3f5?w=800&h=600&fit=crop',
          alt: 'Pondicherry Coastal Breakfast Set',
          position: 0,
        },
      ],
      variants: [],
      collectionIds: ['pondicherry'],
    },

    // Le Jardin Bleu Collection
    {
      name: 'Le Jardin Bleu Cake Stand (3-Tier)',
      slug: 'le-jardin-bleu-cake-stand',
      description: 'Exquisite three-tiered cake stand from our Le Jardin Bleu collection. Features delicate blue floral patterns perfect for afternoon tea parties and special celebrations. French elegance at its finest.',
      price: 4200,
      compareAtPrice: 5000,
      category: 'tableware',
      tags: ['cake stand', 'le jardin bleu', 'blue', 'french', 'tiered'],
      inventory: 10,
      weight: 2.8,
      dimensions: { length: 25, width: 25, height: 35 },
      images: [
        {
          src: 'https://images.unsplash.com/photo-1565362195302-61a3e2fce3f5?w=800&h=600&fit=crop',
          alt: 'Le Jardin Bleu 3-Tier Cake Stand',
          position: 0,
        },
      ],
      variants: [],
      collectionIds: ['le-jardin-bleu'],
    },

    // Stationery Products
    {
      name: 'Floral Paradise Notebook Collection',
      slug: 'floral-paradise-notebook-collection',
      description: 'Premium notebook collection featuring beautiful floral covers. Perfect for journaling, note-taking, and creative writing. High-quality paper ensures smooth writing experience.',
      price: 1200,
      category: 'stationery',
      tags: ['notebooks', 'floral', 'writing', 'journal', 'premium'],
      inventory: 50,
      weight: 0.6,
      dimensions: { length: 21, width: 15, height: 2 },
      images: [
        {
          src: 'https://images.unsplash.com/photo-1565362195302-61a3e2fce3f5?w=800&h=600&fit=crop',
          alt: 'Floral Paradise Notebook Collection',
          position: 0,
        },
      ],
      variants: [
        { name: 'Design', value: 'Rose Garden', priceAdjustment: 0 },
        { name: 'Design', value: 'Botanical', priceAdjustment: 0 },
        { name: 'Design', value: 'Spring Bloom', priceAdjustment: 0 },
      ],
      collectionIds: [],
    },
    {
      name: 'Premium Art Supply Set for Kids',
      slug: 'premium-art-supply-set-kids',
      description: 'Complete art supply set designed for young artists. Includes crayons, markers, colored pencils, drawing papers, and a beautiful storage box. Encourages creativity and artistic expression.',
      price: 2800,
      compareAtPrice: 3500,
      category: 'stationery',
      tags: ['kids', 'art supplies', 'creative', 'drawing', 'storage'],
      inventory: 30,
      weight: 1.5,
      dimensions: { length: 35, width: 25, height: 8 },
      images: [
        {
          src: 'https://images.unsplash.com/photo-1565362195302-61a3e2fce3f5?w=800&h=600&fit=crop',
          alt: 'Premium Art Supply Set for Kids',
          position: 0,
        },
      ],
      variants: [],
      collectionIds: [],
    },

    // Gift Items
    {
      name: 'Studio13 Luxury Gift Hamper',
      slug: 'studio13-luxury-gift-hamper',
      description: 'Curated luxury gift hamper featuring our finest tableware pieces from multiple collections. Perfect for weddings, festivals, and special occasions. Comes in an elegant gift box.',
      price: 8500,
      compareAtPrice: 10500,
      category: 'gifting',
      tags: ['gift hamper', 'luxury', 'curated', 'special occasion'],
      inventory: 8,
      weight: 6.0,
      dimensions: { length: 45, width: 35, height: 25 },
      images: [
        {
          src: 'https://images.unsplash.com/photo-1565362195302-61a3e2fce3f5?w=800&h=600&fit=crop',
          alt: 'Studio13 Luxury Gift Hamper',
          position: 0,
        },
        {
          src: 'https://images.unsplash.com/photo-1565362195302-61a3e2fce3f5?w=800&h=600&fit=crop',
          alt: 'Gift Hamper Contents',
          position: 1,
        },
      ],
      variants: [],
      collectionIds: [],
    },
  ];

  // Create products with their relations
  for (const productData of studio13Products) {
    const { images, variants, collectionIds, ...productInfo } = productData;
    
    const product = await prisma.product.upsert({
      where: { slug: productData.slug },
      update: {},
      create: {
        ...productInfo,
        images: {
          create: images,
        },
        variants: variants.length > 0 ? {
          create: variants,
        } : undefined,
      },
    });

    // Add to collections
    for (const collectionSlug of collectionIds) {
      const collection = collections.find(c => c.slug === collectionSlug);
      if (collection) {
        await prisma.productCollection.upsert({
          where: {
            productId_collectionId: {
              productId: product.id,
              collectionId: collection.id,
            }
          },
          update: {},
          create: {
            productId: product.id,
            collectionId: collection.id,
          },
        });
      }
    }

    console.log(`✅ Created product: ${product.name}`);
  }

  // Create sample reviews for products
  const allProducts = await prisma.product.findMany();
  
  const sampleReviews = [
    {
      productId: allProducts[0]?.id,
      userName: 'Priya Sharma',
      rating: 5,
      title: 'Beautiful Vasant Collection!',
      comment: 'Absolutely love the spring-inspired design. The quality is exceptional and they look gorgeous on our dining table.',
      verified: true,
    },
    {
      productId: allProducts[1]?.id,
      userName: 'Rajesh Kumar',
      rating: 5,
      title: 'Perfect for tea time',
      comment: 'The Vasant tea cups are elegant and the perfect size. Great quality ceramic and beautiful floral patterns.',
      verified: true,
    },
    {
      productId: allProducts[2]?.id,
      userName: 'Meera Patel',
      rating: 4,
      title: 'Lovely serving platter',
      comment: 'The Anaar platter is stunning for entertaining. The pomegranate motifs are beautifully detailed.',
      verified: false,
    },
  ];

  for (let i = 0; i < Math.min(sampleReviews.length, allProducts.length); i++) {
    if (allProducts[i]) {
      await prisma.review.create({
        data: {
          ...sampleReviews[i],
          productId: allProducts[i].id,
        },
      });
    }
  }

  console.log('✅ Created sample reviews');

  // Create Studio13-specific coupons
  const studio13Coupons = [
    {
      code: 'STUDIO13WELCOME',
      type: 'percentage',
      value: 10,
      minAmount: 1500,
      maxDiscount: 500,
      usageLimit: 100,
      isActive: true,
      validFrom: new Date(),
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
    {
      code: 'FESTIVE20',
      type: 'percentage',
      value: 20,
      minAmount: 5000,
      maxDiscount: 2000,
      usageLimit: 50,
      isActive: true,
      validFrom: new Date(),
      validTo: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    },
    {
      code: 'BIGORDER500',
      type: 'fixed',
      value: 500,
      minAmount: 8000,
      usageLimit: 25,
      isActive: true,
      validFrom: new Date(),
      validTo: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    },
  ];

  for (const couponData of studio13Coupons) {
    await prisma.coupon.upsert({
      where: { code: couponData.code },
      update: {},
      create: couponData,
    });
  }

  console.log('✅ Created Studio13 coupons');

  // Create admin user
  await prisma.user.upsert({
    where: { email: 'admin@studio13.co.in' },
    update: {},
    create: {
      email: 'admin@studio13.co.in',
      firstName: 'Studio13',
      lastName: 'Admin',
      phone: '+91 9876543210',
      isAdmin: true,
    },
  });

  console.log('✅ Created admin user');

  console.log('🎉 Studio13 database seeded successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });