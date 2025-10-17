import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export interface AdminSecurityResult {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    email: string;
    isAdmin: boolean;
  };
}

// Enhanced admin authentication check
export async function verifyAdminAccess(request?: NextRequest): Promise<AdminSecurityResult> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Fetch user from database to ensure current admin status
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        isAdmin: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    if (!user.isAdmin) {
      return {
        success: false,
        error: 'Admin access required',
      };
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    };
  } catch (error) {
    console.error('Admin verification error:', error);
    return {
      success: false,
      error: 'Internal server error',
    };
  }
}

// Admin action logging
export interface AdminAction {
  adminId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAdminAction(action: AdminAction): Promise<void> {
  try {
    // In a production environment, you might want to store this in a separate audit log table
    console.log('Admin Action:', {
      timestamp: new Date().toISOString(),
      ...action,
    });
    
    // TODO: Implement proper audit logging to database
    // await prisma.adminAuditLog.create({
    //   data: {
    //     adminId: action.adminId,
    //     action: action.action,
    //     resource: action.resource,
    //     resourceId: action.resourceId,
    //     details: action.details,
    //     ipAddress: action.ipAddress,
    //     userAgent: action.userAgent,
    //     timestamp: new Date(),
    //   },
    // });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}

// Admin session validation
export async function validateAdminSession(sessionId: string): Promise<boolean> {
  try {
    // Additional session validation logic
    // This could include checking session expiry, IP validation, etc.
    return true;
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  }
}

// Sensitive operation confirmation
export function requireAdminConfirmation(operation: string): boolean {
  const sensitiveOperations = [
    'DELETE_USER',
    'DELETE_PRODUCT',
    'BULK_DELETE',
    'CHANGE_USER_ROLE',
    'SYSTEM_SETTINGS',
  ];
  
  return sensitiveOperations.includes(operation);
}

// IP whitelist check (for production environments)
export function isIPWhitelisted(ip: string): boolean {
  // In production, you might want to maintain a whitelist of admin IPs
  const whitelist = process.env.ADMIN_IP_WHITELIST?.split(',') || [];
  
  if (whitelist.length === 0) {
    return true; // No whitelist configured
  }
  
  return whitelist.includes(ip);
}

// Admin permission levels
export enum AdminPermission {
  READ_USERS = 'read_users',
  WRITE_USERS = 'write_users',
  DELETE_USERS = 'delete_users',
  READ_PRODUCTS = 'read_products',
  WRITE_PRODUCTS = 'write_products',
  DELETE_PRODUCTS = 'delete_products',
  READ_ORDERS = 'read_orders',
  WRITE_ORDERS = 'write_orders',
  SYSTEM_SETTINGS = 'system_settings',
  AUDIT_LOGS = 'audit_logs',
}

// Check specific admin permissions
export async function hasAdminPermission(
  userId: string,
  permission: AdminPermission
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });
    
    // For now, all admins have all permissions
    // In a more complex system, you might have role-based permissions
    return user?.isAdmin || false;
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}

// Generate secure admin token for sensitive operations
export function generateAdminToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Validate admin token
export function validateAdminToken(token: string, expectedToken: string): boolean {
  return token === expectedToken;
}

// Admin security headers
export function getAdminSecurityHeaders() {
  return {
    'X-Admin-Access': 'true',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
}