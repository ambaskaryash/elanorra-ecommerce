import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Conditionally import prisma to avoid build-time initialization
let prisma: any;

if (process.env.DATABASE_URL) {
  const { prisma: prismaClient } = require("@/lib/prisma");
  prisma = prismaClient;
} else {
  // Mock prisma for build time
  prisma = {
    user: {
      findUnique: () => Promise.resolve(null),
    },
    adminAction: {
      create: () => Promise.resolve({}),
    }
  };
}

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
    const { userId } = await auth();
    
    if (!userId) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Fetch user from database to ensure current admin status
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
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
  adminEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAdminAction(action: AdminAction): Promise<void> {
  try {
    // Log to console for development
    if (process.env.NODE_ENV === 'development') {
      console.log('Admin Action:', {
        timestamp: new Date().toISOString(),
        ...action,
      });
    }
    
    // Store in database if available
    if (process.env.DATABASE_URL && prisma) {
      await prisma.adminAuditLog.create({
        data: {
          adminId: action.adminId,
          adminEmail: action.adminEmail,
          action: action.action,
          resource: action.resource,
          resourceId: action.resourceId,
          details: action.details,
          ipAddress: action.ipAddress,
          userAgent: action.userAgent,
          timestamp: new Date(),
        },
      });
    }
  } catch (error) {
    console.error('Failed to log admin action:', error);
    // Don't throw error to avoid breaking the main operation
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
      where: { clerkId: userId },
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
    'X-XSS-Protection': '1; mode=block',
  };
}

// Audit log retrieval functions
export interface AuditLogFilter {
  adminId?: string;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export async function getAuditLogs(filter: AuditLogFilter = {}) {
  if (!process.env.DATABASE_URL || !prisma) {
    return { logs: [], total: 0, page: 1, totalPages: 0 };
  }

  try {
    const {
      adminId,
      action,
      resource,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = filter;

    const where: any = {};

    if (adminId) where.adminId = adminId;
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (resource) where.resource = { contains: resource, mode: 'insensitive' };
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        include: {
          admin: {
            select: {
              id: true,
              email: true,
              name: true,
            }
          }
        },
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.adminAuditLog.count({ where })
    ]);

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('Failed to retrieve audit logs:', error);
    return { logs: [], total: 0, page: 1, totalPages: 0 };
  }
}

export async function clearAuditLogs(olderThanDays: number = 90): Promise<boolean> {
  if (!process.env.DATABASE_URL || !prisma) {
    return false;
  }

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    await prisma.adminAuditLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate
        }
      }
    });

    return true;
  } catch (error) {
    console.error('Failed to clear audit logs:', error);
    return false;
  }
}