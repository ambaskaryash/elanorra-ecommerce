import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding users...');

  // Admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      name: 'Admin User',
      phone: '+91 9876543210',
      isAdmin: true,
    },
  });

  // Test user
  const userPassword = await bcrypt.hash('test123', 12);
  await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: userPassword,
      firstName: 'Test',
      lastName: 'User',
      name: 'Test User',
      phone: '+91 9876543211',
      isAdmin: false,
    },
  });

  // Demo customer user
  const demoPassword = await bcrypt.hash('demo123', 12);
  await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      password: demoPassword,
      firstName: 'Demo',
      lastName: 'Customer',
      name: 'Demo Customer',
      phone: '+91 9876543212',
      isAdmin: false,
    },
  });

  console.log('✅ Users seeded successfully!');
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