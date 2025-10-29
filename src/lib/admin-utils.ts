import { prisma } from '@/lib/prisma';
import { currentUser } from '@clerk/nextjs/server';

export interface AdminUtilsResult {
  success: boolean;
  message: string;
  user?: any;
  error?: string;
}

/**
 * Sync a Clerk user with the database
 * This function creates a user record in the database if it doesn't exist
 */
export async function syncClerkUserWithDatabase(clerkUserId: string): Promise<AdminUtilsResult> {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: clerkUserId }
    });

    if (existingUser) {
      return {
        success: true,
        message: 'User already exists in database',
        user: existingUser
      };
    }

    // Get user data from Clerk
    const clerkUser = await currentUser();
    if (!clerkUser || clerkUser.id !== clerkUserId) {
      return {
        success: false,
        message: 'Could not fetch user data from Clerk',
        error: 'Clerk user not found or ID mismatch'
      };
    }

    // Create user in database
    const newUser = await prisma.user.create({
      data: {
        clerkId: clerkUserId,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
        image: clerkUser.imageUrl || null,
        isAdmin: false, // Default to non-admin
      }
    });

    return {
      success: true,
      message: 'User synced successfully',
      user: newUser
    };

  } catch (error) {
    console.error('Error syncing user with database:', error);
    return {
      success: false,
      message: 'Failed to sync user with database',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Grant admin privileges to a user by email
 * This is useful for initial admin setup
 */
export async function grantAdminByEmail(email: string): Promise<AdminUtilsResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return {
        success: false,
        message: 'User not found with this email',
        error: 'User not found'
      };
    }

    if (user.isAdmin) {
      return {
        success: true,
        message: 'User is already an admin',
        user
      };
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: { isAdmin: true }
    });

    return {
      success: true,
      message: 'Admin privileges granted successfully',
      user: updatedUser
    };

  } catch (error) {
    console.error('Error granting admin privileges:', error);
    return {
      success: false,
      message: 'Failed to grant admin privileges',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Grant admin privileges to a user by Clerk ID
 */
export async function grantAdminByClerkId(clerkId: string): Promise<AdminUtilsResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      // Try to sync the user first
      const syncResult = await syncClerkUserWithDatabase(clerkId);
      if (!syncResult.success) {
        return syncResult;
      }
      
      // Now grant admin privileges to the newly synced user
      const updatedUser = await prisma.user.update({
        where: { clerkId },
        data: { isAdmin: true }
      });

      return {
        success: true,
        message: 'User synced and admin privileges granted successfully',
        user: updatedUser
      };
    }

    if (user.isAdmin) {
      return {
        success: true,
        message: 'User is already an admin',
        user
      };
    }

    const updatedUser = await prisma.user.update({
      where: { clerkId },
      data: { isAdmin: true }
    });

    return {
      success: true,
      message: 'Admin privileges granted successfully',
      user: updatedUser
    };

  } catch (error) {
    console.error('Error granting admin privileges:', error);
    return {
      success: false,
      message: 'Failed to grant admin privileges',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Revoke admin privileges from a user
 */
export async function revokeAdminByClerkId(clerkId: string): Promise<AdminUtilsResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return {
        success: false,
        message: 'User not found',
        error: 'User not found'
      };
    }

    if (!user.isAdmin) {
      return {
        success: true,
        message: 'User is not an admin',
        user
      };
    }

    const updatedUser = await prisma.user.update({
      where: { clerkId },
      data: { isAdmin: false }
    });

    return {
      success: true,
      message: 'Admin privileges revoked successfully',
      user: updatedUser
    };

  } catch (error) {
    console.error('Error revoking admin privileges:', error);
    return {
      success: false,
      message: 'Failed to revoke admin privileges',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check if a user is an admin by Clerk ID
 */
export async function isUserAdmin(clerkId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { isAdmin: true }
    });

    return user?.isAdmin || false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Get all admin users
 */
export async function getAllAdmins() {
  try {
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return {
      success: true,
      message: 'Admins retrieved successfully',
      admins
    };
  } catch (error) {
    console.error('Error getting admins:', error);
    return {
      success: false,
      message: 'Failed to retrieve admins',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}