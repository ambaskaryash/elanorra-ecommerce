import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import { withOptimize } from '@prisma/extension-optimize';

// Check if DATABASE_URL is available (for build-time safety)
const isDatabaseAvailable = !!process.env.DATABASE_URL;

// Create a mock Prisma client for build time
const createMockPrismaClient = () => {
  const mockMethods = {
    findMany: () => Promise.resolve([]),
    findUnique: () => Promise.resolve(null),
    findFirst: () => Promise.resolve(null),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    updateMany: () => Promise.resolve({ count: 0 }),
    delete: () => Promise.resolve({}),
    deleteMany: () => Promise.resolve({ count: 0 }),
    count: () => Promise.resolve(0),
    upsert: () => Promise.resolve({}),
    $connect: () => Promise.resolve(),
    $disconnect: () => Promise.resolve(),
  };

  return new Proxy({}, {
    get: (target, prop) => {
      if (typeof prop === 'string' && prop.startsWith('$')) {
        return mockMethods[prop as keyof typeof mockMethods] || (() => Promise.resolve());
      }
      // Return a proxy for model operations (user, product, etc.)
      return new Proxy({}, {
        get: () => mockMethods.findMany
      });
    }
  }) as unknown as PrismaClient;
};

// Build base client and conditionally extend with Optimize only when API key is provided
// Only initialize if DATABASE_URL is available
let prismaClient: PrismaClient;

if (isDatabaseAvailable) {
  const baseClient = new PrismaClient({
    log: ['query'],
  }).$extends(withAccelerate());
      
  const optimizeApiKey = process.env.OPTIMIZE_API_KEY;
  const extendedClient = optimizeApiKey
    ? baseClient.$extends(withOptimize({ apiKey: optimizeApiKey }))
    : baseClient;

  prismaClient = extendedClient as unknown as PrismaClient;
} else {
  prismaClient = createMockPrismaClient();
}

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Attach PrismaClient to the global object in development to prevent exhausting connections
const prisma: PrismaClient = isDatabaseAvailable && process.env.NODE_ENV !== 'production'
  ? ((globalThis.prisma as PrismaClient | undefined) ?? prismaClient)
  : prismaClient;

if (process.env.NODE_ENV !== 'production' && isDatabaseAvailable) {
  globalThis.prisma = prisma;
}

export { prisma };

// Database connection test
export async function connectToDatabase() {
  if (!isDatabaseAvailable) {
    console.warn('⚠️ DATABASE_URL not available, skipping database connection');
    return false;
  }
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function disconnectFromDatabase() {
  if (!isDatabaseAvailable) {
    console.warn('⚠️ DATABASE_URL not available, skipping database disconnection');
    return;
  }
  
  try {
    await prisma.$disconnect();
    console.log('✅ Database disconnected successfully');
  } catch (error) {
    console.error('❌ Error disconnecting from database:', error);
  }
}
