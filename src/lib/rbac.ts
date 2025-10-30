import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import type { Permission } from '@prisma/client';

// Types for better type safety
export type UserWithRole = {
  id: string;
  clerkId: string | null;
  email: string;
  firstName: string | null;
  lastName: string | null;
  image: string | null;
  isAdmin: boolean;
  roleId: string | null;
  createdAt: Date;
  updatedAt: Date;
  role: {
    id: string;
    name: string;
    displayName: string;
    level: number;
    permissions: Array<{
      permission: {
        id: string;
        name: string;
        displayName: string;
        category: string;
        description: string | null;
        isActive: boolean;
      };
    }>;
  } | null;
};

export interface RBACResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface PermissionCheck {
  hasPermission: boolean;
  userRole?: string;
  requiredPermission: string;
}

/**
 * Get current user with role and permissions from Clerk session
 */
export async function getCurrentUserWithRole(): Promise<UserWithRole | null> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return null;
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

    return user;
  } catch (error) {
    console.error('Error getting current user with role:', error);
    return null;
  }
}

/**
 * Check if current user has a specific permission
 */
export async function hasPermission(permissionName: string): Promise<PermissionCheck> {
  try {
    const user = await getCurrentUserWithRole();
    
    if (!user || !user.role) {
      return {
        hasPermission: false,
        requiredPermission: permissionName,
        userRole: 'No Role'
      };
    }

    const hasRequiredPermission = user.role.permissions.some(
      (rp: { permission: { name: string; isActive: boolean } }) => 
        rp.permission.name === permissionName && rp.permission.isActive
    );

    return {
      hasPermission: hasRequiredPermission,
      userRole: user.role.displayName,
      requiredPermission: permissionName
    };
  } catch (error) {
    console.error('Error checking permission:', error);
    return {
      hasPermission: false,
      requiredPermission: permissionName,
      userRole: 'Error'
    };
  }
}

/**
 * Check if current user has any of the specified permissions
 */
export async function hasAnyPermission(permissionNames: string[]): Promise<PermissionCheck> {
  try {
    const user = await getCurrentUserWithRole();
    
    if (!user || !user.role) {
      return {
        hasPermission: false,
        requiredPermission: permissionNames.join(' OR '),
        userRole: 'No Role'
      };
    }

    const userPermissions = user.role.permissions.map((rp: { permission: { name: string } }) => rp.permission.name);
    const hasAnyRequiredPermission = permissionNames.some(
      permission => userPermissions.includes(permission)
    );

    return {
      hasPermission: hasAnyRequiredPermission,
      userRole: user.role.displayName,
      requiredPermission: permissionNames.join(' OR ')
    };
  } catch (error) {
    console.error('Error checking permissions:', error);
    return {
      hasPermission: false,
      requiredPermission: permissionNames.join(' OR '),
      userRole: 'Error'
    };
  }
}

/**
 * Check if current user has a role with sufficient level (lower number = higher privilege)
 */
export async function hasRoleLevel(requiredLevel: number): Promise<boolean> {
  try {
    const user = await getCurrentUserWithRole();
    
    if (!user || !user.role) {
      return false;
    }

    return user.role.level <= requiredLevel;
  } catch (error) {
    console.error('Error checking role level:', error);
    return false;
  }
}

/**
 * Check if current user is Super Admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUserWithRole();
    return user?.role?.name === 'SUPER_ADMIN' || false;
  } catch (error) {
    console.error('Error checking super admin status:', error);
    return false;
  }
}

/**
 * Check if current user is Admin or higher
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUserWithRole();
    
    if (!user || !user.role) {
      return user?.isAdmin || false; // Fallback to old system
    }

    return user.role.level <= 2; // Super Admin (1) or Admin (2)
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Assign role to a user by Clerk ID
 */
export async function assignRole(clerkId: string, roleName: string, assignedBy?: string): Promise<RBACResult> {
  try {
    // Check if current user has permission to manage roles
    const canManageRoles = await hasPermission('MANAGE_ROLES');
    if (!canManageRoles.hasPermission) {
      return {
        success: false,
        message: 'Insufficient permissions to manage roles',
        error: 'PERMISSION_DENIED'
      };
    }

    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return {
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      };
    }

    const role = await prisma.role.findUnique({
      where: { name: roleName }
    });

    if (!role) {
      return {
        success: false,
        message: 'Role not found',
        error: 'ROLE_NOT_FOUND'
      };
    }

    // Prevent non-super-admins from assigning super admin role
    const currentUser = await getCurrentUserWithRole();
    if (roleName === 'SUPER_ADMIN' && currentUser?.role?.name !== 'SUPER_ADMIN') {
      return {
        success: false,
        message: 'Only Super Admins can assign Super Admin role',
        error: 'INSUFFICIENT_PRIVILEGES'
      };
    }

    const updatedUser = await prisma.user.update({
      where: { clerkId },
      data: {
        roleId: role.id,
        isAdmin: role.level <= 2, // Update legacy field
      },
      include: {
        role: true
      }
    });

    return {
      success: true,
      message: `Role ${role.displayName} assigned successfully`,
      data: updatedUser
    };

  } catch (error) {
    console.error('Error assigning role:', error);
    return {
      success: false,
      message: 'Failed to assign role',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get all users with their roles and permissions
 */
export async function getAllUsersWithRoles() {
  try {
    const canViewUsers = await hasPermission('VIEW_USERS');
    if (!canViewUsers.hasPermission) {
      return {
        success: false,
        message: 'Insufficient permissions to view users',
        error: 'PERMISSION_DENIED'
      };
    }

    const users = await prisma.user.findMany({
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
      },
      orderBy: [
        { role: { level: 'asc' } },
        { createdAt: 'desc' }
      ]
    });

    return {
      success: true,
      message: 'Users retrieved successfully',
      data: users
    };

  } catch (error) {
    console.error('Error getting users with roles:', error);
    return {
      success: false,
      message: 'Failed to retrieve users',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get all available roles with permissions
 */
export async function getAllRoles() {
  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: {
            users: true
          }
        }
      },
      orderBy: { level: 'asc' }
    });

    return {
      success: true,
      message: 'Roles retrieved successfully',
      data: roles
    };

  } catch (error) {
    console.error('Error getting roles:', error);
    return {
      success: false,
      message: 'Failed to retrieve roles',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get all available permissions grouped by category
 */
export async function getAllPermissions() {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [
        { category: 'asc' },
        { displayName: 'asc' }
      ]
    });

    // Group by category
    const groupedPermissions = permissions.reduce((acc: Record<string, Permission[]>, permission: Permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);

    return {
      success: true,
      message: 'Permissions retrieved successfully',
      data: groupedPermissions
    };

  } catch (error) {
    console.error('Error getting permissions:', error);
    return {
      success: false,
      message: 'Failed to retrieve permissions',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Sync user from Clerk to database with default role
 */
export async function syncUserFromClerk(clerkUser: any): Promise<RBACResult> {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id }
    });

    if (existingUser) {
      return {
        success: true,
        message: 'User already exists',
        data: existingUser
      };
    }

    // Get default USER role
    const userRole = await prisma.role.findUnique({
      where: { name: 'USER' }
    });

    const newUser = await prisma.user.create({
      data: {
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
        image: clerkUser.imageUrl || null,
        roleId: userRole?.id,
        isAdmin: false,
      },
      include: {
        role: true
      }
    });

    return {
      success: true,
      message: 'User synced successfully',
      data: newUser
    };

  } catch (error) {
    console.error('Error syncing user from Clerk:', error);
    return {
      success: false,
      message: 'Failed to sync user',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Middleware helper to check permissions
 */
export function requirePermission(permissionName: string) {
  return async (req: any, res: any, next: any) => {
    const check = await hasPermission(permissionName);
    
    if (!check.hasPermission) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: check.requiredPermission,
        userRole: check.userRole
      });
    }
    
    next();
  };
}

/**
 * Middleware helper to check role level
 */
export function requireRoleLevel(level: number) {
  return async (req: any, res: any, next: any) => {
    const hasLevel = await hasRoleLevel(level);
    
    if (!hasLevel) {
      return res.status(403).json({
        error: 'Insufficient role level',
        required: `Level ${level} or higher`
      });
    }
    
    next();
  };
}