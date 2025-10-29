import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🛒 Seeding sample orders...');

  // Get existing users and products
  const users = await prisma.user.findMany();
  const products = await prisma.product.findMany();

  if (users.length === 0 || products.length === 0) {
    console.log('❌ No users or products found. Please run the main seed first.');
    return;
  }

  const testUser = users.find((u: any) => u.email === 'test@example.com');
  const demoUser = users.find((u: any) => u.email === 'demo@example.com');

  if (!testUser || !demoUser) {
    console.log('❌ Test users not found. Please run the main seed first.');
    return;
  }

  // Create sample addresses
  const shippingAddress = await prisma.address.create({
    data: {
      userId: testUser.id,
      firstName: 'Test',
      lastName: 'User',
      company: 'Test Company',
      address1: '123 Test Street',
      address2: 'Apt 4B',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
      country: 'India',
      phone: '+91 9876543212',
      isDefault: true,
    },
  });

  const billingAddress = await prisma.address.create({
    data: {
      userId: testUser.id,
      firstName: 'Test',
      lastName: 'User',
      company: 'Test Company',
      address1: '123 Test Street',
      address2: 'Apt 4B',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
      country: 'India',
      phone: '+91 9876543212',
      isDefault: false,
    },
  });

  // Create sample orders
  const sampleOrders = [
    {
      orderNumber: 'EL-2024-001',
      userId: testUser.id,
      email: testUser.email,
      financialStatus: 'paid',
      fulfillmentStatus: 'fulfilled',
      subtotal: 125000,
      shipping: 2000,
      discount: 5000,
      totalPrice: 122000,
      currency: 'INR',
      paymentMethod: 'razorpay',
      paymentId: 'pay_test_123',
      shippingAddressId: shippingAddress.id,
      billingAddressId: billingAddress.id,
      items: [
        {
          productId: products[0].id,
          quantity: 1,
          price: 125000,
          variants: { Color: 'Gray', Size: 'Standard' },
        },
      ],
    },
    {
      orderNumber: 'EL-2024-002',
      userId: testUser.id,
      email: testUser.email,
      financialStatus: 'paid',
      fulfillmentStatus: 'partial',
      subtotal: 93000,
      shipping: 1500,
      discount: 0,
      totalPrice: 94500,
      currency: 'INR',
      paymentMethod: 'razorpay',
      paymentId: 'pay_test_456',
      shippingAddressId: shippingAddress.id,
      billingAddressId: billingAddress.id,
      items: [
        {
          productId: products[1].id,
          quantity: 1,
          price: 75000,
          variants: { Wood: 'Oak' },
        },
        {
          productId: products[4].id,
          quantity: 1,
          price: 18000,
          variants: { Color: 'Natural' },
        },
      ],
    },
    {
      orderNumber: 'EL-2024-003',
      userId: testUser.id,
      email: testUser.email,
      financialStatus: 'pending',
      fulfillmentStatus: 'unfulfilled',
      subtotal: 35000,
      shipping: 1000,
      discount: 2000,
      totalPrice: 34000,
      currency: 'INR',
      paymentMethod: 'razorpay',
      shippingAddressId: shippingAddress.id,
      billingAddressId: billingAddress.id,
      items: [
        {
          productId: products[3].id,
          quantity: 1,
          price: 35000,
          variants: {},
        },
      ],
    },
    {
      orderNumber: 'EL-2024-004',
      userId: demoUser.id,
      email: demoUser.email,
      financialStatus: 'paid',
      fulfillmentStatus: 'fulfilled',
      subtotal: 95000,
      shipping: 2500,
      discount: 10000,
      totalPrice: 87500,
      currency: 'INR',
      paymentMethod: 'razorpay',
      paymentId: 'pay_demo_789',
      shippingAddressId: shippingAddress.id,
      billingAddressId: billingAddress.id,
      items: [
        {
          productId: products[2].id,
          quantity: 1,
          price: 95000,
          variants: { Material: 'Upholstered', Color: 'Charcoal' },
        },
      ],
    },
  ];

  // Create orders with items
  for (const orderData of sampleOrders) {
    const { items, ...orderInfo } = orderData;
    
    const order = await prisma.order.create({
      data: {
        ...orderInfo,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
      },
    });

    // Create order items
    for (const itemData of items) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          ...itemData,
        },
      });
    }

    console.log(`✅ Created order: ${order.orderNumber}`);
  }

  console.log('🎉 Sample orders seeded successfully!');
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