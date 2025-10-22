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
  }) as any;
};

// Only import and initialize Prisma if DATABASE_URL is available
let prismaClient: any;

if (isDatabaseAvailable) {
  // Dynamic imports to avoid loading Prisma during build time
  const { PrismaClient } = require('@prisma/client');
  const { withAccelerate } = require('@prisma/extension-accelerate');
  
  const baseClient = new PrismaClient({
    log: ['query'],
  }).$extends(withAccelerate());
      
  const optimizeApiKey = process.env.OPTIMIZE_API_KEY;
  if (optimizeApiKey) {
    try {
      const { withOptimize } = require('@prisma/extension-optimize');
      prismaClient = baseClient.$extends(withOptimize({ apiKey: optimizeApiKey }));
    } catch (error) {
      console.warn('Failed to load Prisma Optimize extension:', error);
      prismaClient = baseClient;
    }
  } else {
    prismaClient = baseClient;
  }

} else {
  prismaClient = createMockPrismaClient();
}

declare global {
  // eslint-disable-next-line no-var
  var prisma: any | undefined;
}

// Attach PrismaClient to the global object in development to prevent exhausting connections
const prisma: any = isDatabaseAvailable && process.env.NODE_ENV !== 'production'
  ? ((globalThis.prisma as any | undefined) ?? prismaClient)
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
