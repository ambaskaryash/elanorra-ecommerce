import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import { withOptimize } from '@prisma/extension-optimize';

// Build base client and conditionally extend with Optimize only when API key is provided
const baseClient = new PrismaClient({
  log: ['query'],
}).$extends(withAccelerate());

const optimizeApiKey = process.env.OPTIMIZE_API_KEY;
const extendedClient = optimizeApiKey
  ? baseClient.$extends(withOptimize({ apiKey: optimizeApiKey }))
  : baseClient;

type ExtendedPrismaClient = typeof extendedClient;

declare global {
  // eslint-disable-next-line no-var
  var prisma: ExtendedPrismaClient | undefined;
}

// Attach PrismaClient to the global object in development to prevent exhausting connections
const prisma: ExtendedPrismaClient = globalThis.prisma ?? extendedClient;

if (process.env.NODE_ENV !== 'production') (globalThis as any).prisma = prisma;

export { prisma };

// Database connection test
export async function connectToDatabase() {
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
  try {
    await prisma.$disconnect();
    console.log('✅ Database disconnected successfully');
  } catch (error) {
    console.error('❌ Error disconnecting from database:', error);
  }
}