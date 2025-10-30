import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { RolePermission, Permission } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({
        canManageUsers: false,
        canManageProducts: false,
        canManageOrders: false,
        canManageBlog: false,
        canManageNewsletter: false,
        canViewAnalytics: false,
        canManageRoles: false,
        canAccessSystemSettings: false,
        userRole: 'Guest',
        userLevel: 3,
        permissions: []
      });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    if (!user || !user.role) {
      return NextResponse.json({
        canManageUsers: false,
        canManageProducts: false,
        canManageOrders: false,
        canManageBlog: false,
        canManageNewsletter: false,
        canViewAnalytics: false,
        canManageRoles: false,
        canAccessSystemSettings: false,
        userRole: 'User',
        userLevel: 3,
        permissions: []
      });
    }

    const permissions = user.role.permissions.map((rp: RolePermission & { permission: Permission }) => rp.permission.name);
    
    return NextResponse.json({
      canManageUsers: permissions.includes('MANAGE_USERS'),
      canManageProducts: permissions.includes('CREATE_PRODUCTS') || permissions.includes('EDIT_PRODUCTS') || permissions.includes('MANAGE_PRODUCTS'),
      canManageOrders: permissions.includes('VIEW_ALL_ORDERS') || permissions.includes('MANAGE_ORDERS'),
      canManageBlog: permissions.includes('MANAGE_BLOG'),
      canManageNewsletter: permissions.includes('MANAGE_NEWSLETTER'),
      canViewAnalytics: permissions.includes('VIEW_ANALYTICS'),
      canManageRoles: permissions.includes('MANAGE_ROLES'),
      canAccessSystemSettings: permissions.includes('SYSTEM_SETTINGS') || permissions.includes('MANAGE_SETTINGS'),
      userRole: user.role.name,
      userLevel: user.role.level,
      permissions: permissions
    });

  } catch (error) {
    console.error('Error getting user capabilities:', error);
    return NextResponse.json({
      canManageUsers: false,
      canManageProducts: false,
      canManageOrders: false,
      canManageBlog: false,
      canManageNewsletter: false,
      canViewAnalytics: false,
      canManageRoles: false,
      canAccessSystemSettings: false,
      userRole: 'Error',
      userLevel: 3,
      permissions: []
    }, { status: 500 });
  }
}