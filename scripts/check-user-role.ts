#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

function parseArgs() {
  const args = process.argv.slice(2);
  const result: { email?: string; url?: string } = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--email') {
      result.email = args[i + 1];
      i++;
    } else if (arg === '--url') {
      result.url = args[i + 1];
      i++;
    }
  }
  return result;
}

async function main() {
  const { email, url } = parseArgs();
  if (!email) {
    console.error('Usage: npx tsx scripts/check-user-role.ts --email <email> [--url <DATABASE_URL>]');
    process.exit(1);
  }

  if (url) {
    process.env.DATABASE_URL = url;
    console.log(`Using provided DATABASE_URL: ${url}`);
  } else {
    console.log(`Using DATABASE_URL from environment`);
  }

  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      console.log(`User not found for email: ${email}`);
      process.exit(2);
    }

    const roleName = user.role?.name ?? 'None';
    const roleLevel = user.role?.level ?? null;
    const permissions = (user.role?.permissions ?? []).map(
      (rp: { permission: { name: string } }) => rp.permission.name
    );

    console.log('User Summary');
    console.log('-------------');
    console.log(`Email      : ${user.email}`);
    console.log(`Clerk ID   : ${user.clerkId ?? 'null'}`);
    console.log(`isAdmin    : ${user.isAdmin}`);
    console.log(`Role       : ${roleName}`);
    console.log(`Role Level : ${roleLevel ?? 'null'}`);
    console.log(`Permissions: ${permissions.length > 0 ? permissions.join(', ') : '[]'}`);

    if (!user.role) {
      console.log('Note: No role assigned. If this is production, run RBAC seed to assign roles.');
    }
  } catch (err) {
    console.error('Error querying user:', (err as Error).message);
    process.exit(3);
  } finally {
    await prisma.$disconnect();
  }
}

main();