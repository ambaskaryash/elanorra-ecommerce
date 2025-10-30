#!/usr/bin/env node

/**
 * CLI Script to grant admin privileges to users
 * Usage: 
 *   node scripts/grant-admin.js --email user@example.com
 *   node scripts/grant-admin.js --clerk-id user_2abc123def
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function grantAdminByEmail(email) {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.error(`❌ User not found with email: ${email}`);
      console.log('💡 Make sure the user has logged in at least once to sync with the database.');
      return false;
    }

    if (user.isAdmin) {
      console.log(`✅ User ${email} is already an admin.`);
      return true;
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: { isAdmin: true }
    });

    console.log(`✅ Admin privileges granted to ${email}`);
    console.log(`   User ID: ${updatedUser.id}`);
    console.log(`   Clerk ID: ${updatedUser.clerkId}`);
    return true;

  } catch (error) {
    console.error('❌ Error granting admin privileges:', error.message);
    return false;
  }
}

async function grantAdminByClerkId(clerkId) {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      console.error(`❌ User not found with Clerk ID: ${clerkId}`);
      console.log('💡 Make sure the user has logged in at least once to sync with the database.');
      return false;
    }

    if (user.isAdmin) {
      console.log(`✅ User with Clerk ID ${clerkId} is already an admin.`);
      return true;
    }

    const updatedUser = await prisma.user.update({
      where: { clerkId },
      data: { isAdmin: true }
    });

    console.log(`✅ Admin privileges granted to user with Clerk ID: ${clerkId}`);
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Name: ${updatedUser.firstName} ${updatedUser.lastName}`);
    return true;

  } catch (error) {
    console.error('❌ Error granting admin privileges:', error.message);
    return false;
  }
}

async function listAdmins() {
  try {
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true
      }
    });

    if (admins.length === 0) {
      console.log('📋 No admin users found.');
      return;
    }

    console.log(`📋 Found ${admins.length} admin user(s):`);
    console.log('');
    
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.firstName} ${admin.lastName} (${admin.email})`);
      console.log(`   Clerk ID: ${admin.clerkId}`);
      console.log(`   Created: ${admin.createdAt.toLocaleDateString()}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error listing admins:', error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🔧 Admin Management Script');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/grant-admin.js --email user@example.com');
    console.log('  node scripts/grant-admin.js --clerk-id user_2abc123def');
    console.log('  node scripts/grant-admin.js --list');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/grant-admin.js --email admin@mystore.com');
    console.log('  node scripts/grant-admin.js --list');
    process.exit(1);
  }

  try {
    if (args[0] === '--email' && args[1]) {
      await grantAdminByEmail(args[1]);
    } else if (args[0] === '--clerk-id' && args[1]) {
      await grantAdminByClerkId(args[1]);
    } else if (args[0] === '--list') {
      await listAdmins();
    } else {
      console.error('❌ Invalid arguments. Use --email, --clerk-id, or --list');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();