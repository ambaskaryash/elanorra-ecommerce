import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminMiddleware } from '../middleware';
import { handleError } from '@/lib/error-handler';

// In-memory audit log (use database in production)
interface AuditLogEntry {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  timestamp: Date;
  ip: string;
  userAgent: string;
}

const auditLog: AuditLogEntry[] = [];

// GET /api/admin/audit - Retrieve audit logs
export async function GET(request: NextRequest) {
  // Apply admin middleware
  const middlewareResponse = await adminMiddleware(request, {
    logAction: 'VIEW_AUDIT_LOGS'
  });
  if (middlewareResponse) return middlewareResponse;

  try {
    const session = await getServerSession(authOptions);
    const url = new URL(request.url);
    
    // Query parameters for filtering
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const action = url.searchParams.get('action');
    const resource = url.searchParams.get('resource');
    const adminId = url.searchParams.get('adminId');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Filter logs
    let filteredLogs = [...auditLog];

    if (action) {
      filteredLogs = filteredLogs.filter(log => log.action.includes(action.toUpperCase()));
    }

    if (resource) {
      filteredLogs = filteredLogs.filter(log => log.resource.includes(resource.toLowerCase()));
    }

    if (adminId) {
      filteredLogs = filteredLogs.filter(log => log.adminId === adminId);
    }

    if (startDate) {
      const start = new Date(startDate);
      filteredLogs = filteredLogs.filter(log => log.timestamp >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      filteredLogs = filteredLogs.filter(log => log.timestamp <= end);
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

    return NextResponse.json({
      logs: paginatedLogs,
      pagination: {
        page,
        limit,
        total: filteredLogs.length,
        pages: Math.ceil(filteredLogs.length / limit),
      },
      filters: {
        action,
        resource,
        adminId,
        startDate,
        endDate,
      }
    });
  } catch (error) {
    return handleError(error, {
      url: request.url,
      method: request.method,
      userAgent: request.headers.get('user-agent') || undefined,
    });
  }
}

// POST /api/admin/audit - Add audit log entry
export async function POST(request: NextRequest) {
  // Apply admin middleware
  const middlewareResponse = await adminMiddleware(request, {
    logAction: 'CREATE_AUDIT_LOG'
  });
  if (middlewareResponse) return middlewareResponse;

  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    const {
      action,
      resource,
      resourceId,
      details
    } = body;

    if (!action || !resource) {
      return NextResponse.json(
        { error: 'Action and resource are required' },
        { status: 400 }
      );
    }

    const auditEntry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      adminId: session!.user!.id!,
      adminEmail: session!.user!.email!,
      action: action.toUpperCase(),
      resource: resource.toLowerCase(),
      resourceId,
      details,
      timestamp: new Date(),
      ip: request.headers.get('x-forwarded-for') || 
          request.headers.get('x-real-ip') || 
          'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    };

    // Add to audit log
    auditLog.push(auditEntry);

    // Keep only last 10000 entries to prevent memory issues
    if (auditLog.length > 10000) {
      auditLog.splice(0, auditLog.length - 10000);
    }

    return NextResponse.json({
      success: true,
      auditId: auditEntry.id,
      message: 'Audit log entry created'
    });
  } catch (error) {
    return handleError(error, {
      url: request.url,
      method: request.method,
      userAgent: request.headers.get('user-agent') || undefined,
    });
  }
}

// DELETE /api/admin/audit - Clear audit logs (super admin only)
export async function DELETE(request: NextRequest) {
  // Apply admin middleware
  const middlewareResponse = await adminMiddleware(request, {
    requireSuperAdmin: true,
    logAction: 'CLEAR_AUDIT_LOGS'
  });
  if (middlewareResponse) return middlewareResponse;

  try {
    const session = await getServerSession(authOptions);
    const url = new URL(request.url);
    const confirm = url.searchParams.get('confirm');

    if (confirm !== 'true') {
      return NextResponse.json(
        { error: 'Confirmation required. Add ?confirm=true to clear audit logs.' },
        { status: 400 }
      );
    }

    const clearedCount = auditLog.length;
    auditLog.length = 0; // Clear the array

    // Log this critical action
    console.warn(`CRITICAL: Admin ${session!.user!.id} cleared ${clearedCount} audit log entries at ${new Date().toISOString()}`);

    return NextResponse.json({
      success: true,
      message: `Cleared ${clearedCount} audit log entries`,
      clearedCount
    });
  } catch (error) {
    return handleError(error, {
      url: request.url,
      method: request.method,
      userAgent: request.headers.get('user-agent') || undefined,
    });
  }
}

// Helper function to add audit log entries from other parts of the application
export function addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
  const auditEntry: AuditLogEntry = {
    ...entry,
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
  };

  auditLog.push(auditEntry);

  // Keep only last 10000 entries
  if (auditLog.length > 10000) {
    auditLog.splice(0, auditLog.length - 10000);
  }

  return auditEntry.id;
}