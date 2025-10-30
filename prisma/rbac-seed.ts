import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedRBAC() {
  console.log('🚀 Starting RBAC seed...');

  // Define permissions
  const permissions = [
    // User Management
    { name: 'MANAGE_USERS', displayName: 'Manage Users', description: 'Create, update, delete users', category: 'USER_MANAGEMENT' },
    { name: 'VIEW_USERS', displayName: 'View Users', description: 'View user list and details', category: 'USER_MANAGEMENT' },
    { name: 'MANAGE_ROLES', displayName: 'Manage Roles', description: 'Assign and revoke user roles', category: 'USER_MANAGEMENT' },
    
    // Product Management
    { name: 'MANAGE_PRODUCTS', displayName: 'Manage Products', description: 'Create, update, delete products', category: 'PRODUCT_MANAGEMENT' },
    { name: 'VIEW_PRODUCTS', displayName: 'View Products', description: 'View product list and details', category: 'PRODUCT_MANAGEMENT' },
    { name: 'MANAGE_INVENTORY', displayName: 'Manage Inventory', description: 'Update product inventory', category: 'PRODUCT_MANAGEMENT' },
    
    // Order Management
    { name: 'MANAGE_ORDERS', displayName: 'Manage Orders', description: 'View and update order status', category: 'ORDER_MANAGEMENT' },
    { name: 'VIEW_ORDERS', displayName: 'View Orders', description: 'View order list and details', category: 'ORDER_MANAGEMENT' },
    { name: 'PROCESS_REFUNDS', displayName: 'Process Refunds', description: 'Process order refunds', category: 'ORDER_MANAGEMENT' },
    
    // Content Management
    { name: 'MANAGE_BLOG', displayName: 'Manage Blog', description: 'Create, update, delete blog posts', category: 'CONTENT_MANAGEMENT' },
    { name: 'MANAGE_NEWSLETTER', displayName: 'Manage Newsletter', description: 'Send newsletters and manage subscribers', category: 'CONTENT_MANAGEMENT' },
    
    // Analytics & Reports
    { name: 'VIEW_ANALYTICS', displayName: 'View Analytics', description: 'Access analytics and reports', category: 'ANALYTICS' },
    { name: 'VIEW_FINANCIAL_REPORTS', displayName: 'View Financial Reports', description: 'Access financial data and reports', category: 'ANALYTICS' },
    
    // System Management
    { name: 'MANAGE_SETTINGS', displayName: 'Manage Settings', description: 'Update system settings', category: 'SYSTEM_MANAGEMENT' },
    { name: 'VIEW_AUDIT_LOGS', displayName: 'View Audit Logs', description: 'Access system audit logs', category: 'SYSTEM_MANAGEMENT' },
    { name: 'MANAGE_COUPONS', displayName: 'Manage Coupons', description: 'Create and manage discount coupons', category: 'SYSTEM_MANAGEMENT' },
    
    // Customer Support
    { name: 'MANAGE_REVIEWS', displayName: 'Manage Reviews', description: 'Moderate product reviews', category: 'CUSTOMER_SUPPORT' },
    { name: 'MANAGE_RETURNS', displayName: 'Manage Returns', description: 'Process return requests', category: 'CUSTOMER_SUPPORT' },
  ];

  // Create permissions
  console.log('📝 Creating permissions...');
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: permission,
      create: permission,
    });
  }

  // Define roles with their permission sets
  const roles = [
    {
      name: 'SUPER_ADMIN',
      displayName: 'Super Admin',
      description: 'Full system access with all permissions',
      level: 1,
      permissions: permissions.map(p => p.name), // All permissions
    },
    {
      name: 'ADMIN',
      displayName: 'Admin',
      description: 'Administrative access with limited system management',
      level: 2,
      permissions: [
        'VIEW_USERS', 'MANAGE_PRODUCTS', 'VIEW_PRODUCTS', 'MANAGE_INVENTORY',
        'MANAGE_ORDERS', 'VIEW_ORDERS', 'PROCESS_REFUNDS',
        'MANAGE_BLOG', 'MANAGE_NEWSLETTER',
        'VIEW_ANALYTICS', 'MANAGE_COUPONS',
        'MANAGE_REVIEWS', 'MANAGE_RETURNS'
      ],
    },
    {
      name: 'USER',
      displayName: 'User',
      description: 'Standard user with basic permissions',
      level: 3,
      permissions: ['VIEW_PRODUCTS'], // Minimal permissions
    },
  ];

  // Create roles and assign permissions
  console.log('👥 Creating roles...');
  for (const roleData of roles) {
    const { permissions: rolePermissions, ...roleInfo } = roleData;
    
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: roleInfo,
      create: roleInfo,
    });

    // Assign permissions to role
    for (const permissionName of rolePermissions) {
      const permission = await prisma.permission.findUnique({
        where: { name: permissionName }
      });

      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            }
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
      }
    }
  }

  // Make kimetsu119@gmail.com a Super Admin
  console.log('👑 Setting up Super Admin...');
  const superAdminRole = await prisma.role.findUnique({
    where: { name: 'SUPER_ADMIN' }
  });

  if (superAdminRole) {
    const superAdminUser = await prisma.user.findUnique({
      where: { email: 'kimetsu119@gmail.com' }
    });

    if (superAdminUser) {
      await prisma.user.update({
        where: { email: 'kimetsu119@gmail.com' },
        data: {
          roleId: superAdminRole.id,
          isAdmin: true, // Keep backward compatibility
        }
      });
      console.log('✅ kimetsu119@gmail.com has been granted Super Admin privileges');
    } else {
      console.log('⚠️  User kimetsu119@gmail.com not found in database. They need to log in first.');
    }
  }

  // Set default role for existing users without roles
  console.log('🔄 Setting default roles for existing users...');
  const userRole = await prisma.role.findUnique({
    where: { name: 'USER' }
  });

  if (userRole) {
    await prisma.user.updateMany({
      where: { roleId: null },
      data: { roleId: userRole.id }
    });
  }

  console.log('✅ RBAC seed completed successfully!');
}

async function main() {
  try {
    await seedRBAC();
  } catch (error) {
    console.error('❌ Error seeding RBAC:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { seedRBAC };