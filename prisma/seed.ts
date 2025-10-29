import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test users
  const adminPasswordHash = await bcrypt.hash('admin123', 12);
  const demoPasswordHash = await bcrypt.hash('demo123', 12);
  const testPasswordHash = await bcrypt.hash('test123', 12);
  
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        phone: '+91 9876543210',
        isAdmin: true,
        password: adminPasswordHash,
        emailVerified: new Date(),
      },
    }),
    prisma.user.upsert({
      where: { email: 'demo@example.com' },
      update: {},
      create: {
        email: 'demo@example.com',
        firstName: 'Demo',
        lastName: 'User',
        phone: '+91 9876543211',
        isAdmin: true,
        password: demoPasswordHash,
        emailVerified: new Date(),
      },
    }),
    prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'Customer',
        phone: '+91 9876543212',
        isAdmin: false,
        password: testPasswordHash,
        emailVerified: new Date(),
      },
    }),
  ]);

  console.log('✅ Created users');

  // Create collections
  const collections = await Promise.all([
    prisma.collection.upsert({
      where: { slug: 'living-room' },
      update: {},
      create: {
        name: 'Living Room',
        slug: 'living-room',
        description: 'Comfortable and stylish furniture for your living room',
        image: 'https://picsum.photos/seed/living-room/800/600',
      },
    }),
    prisma.collection.upsert({
      where: { slug: 'bedroom' },
      update: {},
      create: {
        name: 'Bedroom',
        slug: 'bedroom',
        description: 'Create your perfect sleeping sanctuary',
        image: 'https://picsum.photos/seed/bedroom/800/600',
      },
    }),
    prisma.collection.upsert({
      where: { slug: 'dining-room' },
      update: {},
      create: {
        name: 'Dining Room',
        slug: 'dining-room',
        description: 'Elegant dining furniture for memorable meals',
        image: 'https://picsum.photos/seed/dining-room/800/600',
      },
    }),
  ]);

  console.log('✅ Created collections');

  // Create products with variants and images
  const products = [
    {
      name: 'Modern Sectional Sofa',
      slug: 'modern-sectional-sofa',
      description: 'A contemporary sectional sofa with clean lines and plush cushions. Perfect for modern living rooms.',
      price: 125000,
      compareAtPrice: 150000,
      category: 'sofas',
      tags: ['modern', 'sectional', 'contemporary', 'living-room'],
      inventory: 12,
      weight: 85.5,
      dimensions: {
        length: 280,
        width: 180,
        height: 85,
      },
      images: [
        {
          src: 'https://picsum.photos/seed/sofa-1/800/600',
          alt: 'Modern sectional sofa in living room',
          position: 0,
        },
        {
          src: 'https://picsum.photos/seed/sofa-2/800/600',
          alt: 'Sectional sofa detail view',
          position: 1,
        },
      ],
      variants: [
        { name: 'Color', value: 'Gray', priceAdjustment: 0 },
        { name: 'Color', value: 'Navy', priceAdjustment: 5000 },
        { name: 'Color', value: 'Beige', priceAdjustment: 3000 },
        { name: 'Size', value: 'Standard', priceAdjustment: 0 },
        { name: 'Size', value: 'Large', priceAdjustment: 15000 },
      ],
    },
    {
      name: 'Elegant Dining Table',
      slug: 'elegant-dining-table',
      description: 'Solid wood dining table with extendable design. Seats 6-8 people comfortably.',
      price: 75000,
      compareAtPrice: 90000,
      category: 'dining',
      tags: ['dining', 'wood', 'extendable', 'formal'],
      inventory: 8,
      weight: 65.0,
      dimensions: {
        length: 180,
        width: 90,
        height: 75,
      },
      images: [
        {
          src: 'https://picsum.photos/seed/dining-table/800/600',
          alt: 'Elegant wooden dining table',
          position: 0,
        },
      ],
      variants: [
        { name: 'Wood', value: 'Oak', priceAdjustment: 0 },
        { name: 'Wood', value: 'Walnut', priceAdjustment: 10000 },
        { name: 'Wood', value: 'Mahogany', priceAdjustment: 15000 },
      ],
    },
    {
      name: 'Luxury King Bed Frame',
      slug: 'luxury-king-bed-frame',
      description: 'Premium upholstered bed frame with tufted headboard. Available in multiple sizes.',
      price: 95000,
      compareAtPrice: 120000,
      category: 'bedroom',
      tags: ['bedroom', 'luxury', 'upholstered', 'tufted'],
      inventory: 5,
      weight: 45.0,
      dimensions: {
        length: 220,
        width: 200,
        height: 120,
      },
      images: [
        {
          src: 'https://picsum.photos/seed/king-bed/800/600',
          alt: 'Luxury king bed frame',
          position: 0,
        },
      ],
      variants: [
        { name: 'Size', value: 'Queen', priceAdjustment: -15000 },
        { name: 'Size', value: 'King', priceAdjustment: 0 },
        { name: 'Color', value: 'Charcoal', priceAdjustment: 0 },
        { name: 'Color', value: 'Cream', priceAdjustment: 2000 },
      ],
    },
    {
      name: 'Ergonomic Office Chair',
      slug: 'ergonomic-office-chair',
      description: 'Professional ergonomic office chair with lumbar support and adjustable height.',
      price: 25000,
      compareAtPrice: 35000,
      category: 'chairs',
      tags: ['office', 'ergonomic', 'professional', 'adjustable'],
      inventory: 20,
      weight: 15.5,
      dimensions: {
        length: 70,
        width: 70,
        height: 120,
      },
      images: [
        {
          src: 'https://picsum.photos/seed/office-chair/800/600',
          alt: 'Ergonomic office chair',
          position: 0,
        },
      ],
      variants: [
        { name: 'Color', value: 'Black', priceAdjustment: 0 },
        { name: 'Color', value: 'Gray', priceAdjustment: 1000 },
        { name: 'Material', value: 'Mesh', priceAdjustment: 0 },
        { name: 'Material', value: 'Leather', priceAdjustment: 8000 },
      ],
    },
    {
      name: 'Coffee Table Set',
      slug: 'coffee-table-set',
      description: 'Modern glass-top coffee table with matching side tables. Perfect for contemporary living rooms.',
      price: 35000,
      category: 'tables',
      tags: ['coffee-table', 'glass', 'modern', 'set'],
      inventory: 15,
      weight: 25.0,
      images: [
        {
          src: 'https://picsum.photos/seed/coffee-table/800/600',
          alt: 'Modern coffee table set',
          position: 0,
        },
      ],
      variants: [],
    },
    {
      name: 'Bookshelf Unit',
      slug: 'bookshelf-unit',
      description: 'Five-tier wooden bookshelf with adjustable shelves. Great for home office or living room.',
      price: 18000,
      compareAtPrice: 24000,
      category: 'storage',
      tags: ['bookshelf', 'storage', 'wood', 'adjustable'],
      inventory: 10,
      weight: 35.0,
      images: [
        {
          src: 'https://picsum.photos/seed/bookshelf/800/600',
          alt: 'Wooden bookshelf unit',
          position: 0,
        },
      ],
      variants: [
        { name: 'Color', value: 'Natural', priceAdjustment: 0 },
        { name: 'Color', value: 'White', priceAdjustment: 1500 },
        { name: 'Color', value: 'Dark Brown', priceAdjustment: 2000 },
      ],
    },
  ];

  // Create products with their relations
  for (const productData of products) {
    const { images, variants, ...productInfo } = productData;
    
    const product = await prisma.product.upsert({
      where: { slug: productData.slug },
      update: {},
      create: {
        ...productInfo,
        images: {
          create: images,
        },
        variants: {
          create: variants,
        },
      },
    });

    // Add to collections
    if (productInfo.category === 'sofas' || productInfo.category === 'tables') {
      await prisma.productCollection.upsert({
        where: {
          productId_collectionId: {
            productId: product.id,
            collectionId: collections[0].id, // Living Room
          }
        },
        update: {},
        create: {
          productId: product.id,
          collectionId: collections[0].id,
        },
      });
    }

    if (productInfo.category === 'bedroom') {
      await prisma.productCollection.upsert({
        where: {
          productId_collectionId: {
            productId: product.id,
            collectionId: collections[1].id, // Bedroom
          }
        },
        update: {},
        create: {
          productId: product.id,
          collectionId: collections[1].id,
        },
      });
    }

    if (productInfo.category === 'dining') {
      await prisma.productCollection.upsert({
        where: {
          productId_collectionId: {
            productId: product.id,
            collectionId: collections[2].id, // Dining Room
          }
        },
        update: {},
        create: {
          productId: product.id,
          collectionId: collections[2].id,
        },
      });
    }

    console.log(`✅ Created product: ${product.name}`);
  }

  // Create sample reviews
  const allProducts = await prisma.product.findMany();
  
  const sampleReviews = [
    {
      productId: allProducts[0].id,
      userId: users[1].id,
      userName: 'Jane Customer',
      rating: 5,
      title: 'Amazing quality!',
      comment: 'This sofa exceeded my expectations. Very comfortable and looks great in our living room.',
      verified: true,
    },
    {
      productId: allProducts[0].id,
      userName: 'Anonymous Buyer',
      rating: 4,
      title: 'Good value',
      comment: 'Nice sofa for the price. Delivery was quick and assembly was straightforward.',
      verified: false,
    },
    {
      productId: allProducts[1].id,
      userName: 'Home Owner',
      rating: 5,
      title: 'Perfect dining table',
      comment: 'Beautiful craftsmanship. The extendable feature works perfectly for family gatherings.',
      verified: true,
    },
  ];

  for (const reviewData of sampleReviews) {
    await prisma.review.upsert({
      where: {
        id: 'temp-' + Math.random().toString(36).substr(2, 9),
      },
      update: {},
      create: reviewData,
    });
  }

  console.log('✅ Created sample reviews');

  // Create sample coupons
  const coupons = [
    {
      code: 'WELCOME10',
      type: 'percentage',
      value: 10,
      minAmount: 20000,
      maxDiscount: 5000,
      usageLimit: 100,
      isActive: true,
      validFrom: new Date(),
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
    {
      code: 'SAVE5000',
      type: 'fixed',
      value: 5000,
      minAmount: 50000,
      usageLimit: 50,
      isActive: true,
      validFrom: new Date(),
      validTo: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    },
    {
      code: 'BIGSPEND',
      type: 'percentage',
      value: 15,
      minAmount: 100000,
      maxDiscount: 20000,
      usageLimit: 20,
      isActive: true,
      validFrom: new Date(),
      validTo: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    },
  ];

  for (const couponData of coupons) {
    await prisma.coupon.upsert({
      where: { code: couponData.code },
      update: {},
      create: couponData,
    });
  }

  console.log('✅ Created coupons');

  console.log('🎉 Database seeded successfully!');
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