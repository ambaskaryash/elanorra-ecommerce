import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import { withOptimize } from '@prisma/extension-optimize';

// Trigger a non-functional change to force TypeScript re-evaluation
// const dummy = 1;

// Check if DATABASE_URL is available (for build-time safety)
const isDatabaseAvailable = !!process.env.DATABASE_URL;

// Build base client and conditionally extend with Optimize only when API key is provided
// Only initialize if DATABASE_URL is available
const baseClient = isDatabaseAvailable 
  ? new PrismaClient({
      log: ['query'],
    }).$extends(withAccelerate())
  : null;
      
const optimizeApiKey = process.env.OPTIMIZE_API_KEY;
const extendedClient = baseClient && optimizeApiKey
  ? baseClient.$extends(withOptimize({ apiKey: optimizeApiKey }))
  : baseClient;

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Attach PrismaClient to the global object in development to prevent exhausting connections
// Only create prisma instance if database is available
const prisma: PrismaClient = isDatabaseAvailable 
  ? ((globalThis.prisma as PrismaClient | undefined) ?? (extendedClient as unknown as PrismaClient))
  : ({} as PrismaClient); // Mock object for build time

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
