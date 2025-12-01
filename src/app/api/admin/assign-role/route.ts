import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const assignRoleSchema = z.object({
  userId: z.string(),
  roleId: z.string()
});

// POST - Assign role to user (admin only)
export async function POST(request: NextRequest) {
  try {
    const { userId: currentUserId } = await auth();
    if (!currentUserId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if current user is admin
    const currentUserRecord = await prisma.user.findUnique({
      where: { clerkId: currentUserId },
      select: { 
        isAdmin: true, 
        id: true, 
        role: {
          select: { level: true, name: true }
        }
      }
    });

    if (!currentUserRecord?.isAdmin) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, roleId } = assignRoleSchema.parse(body);

    // Get the role being assigned
    const targetRole = await prisma.role.findUnique({
      where: { id: roleId },
      select: { level: true, name: true }
    });

    if (!targetRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Prevent non-super-admins from assigning super admin roles
    const currentUserLevel = currentUserRecord.role?.level || 0;
    if (targetRole.level >= 100 && currentUserLevel < 100) {
      return NextResponse.json({ 
        error: 'Insufficient privileges to assign this role' 
      }, { status: 403 });
    }

    // Update user's role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { roleId },
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

    // Log the action
    await prisma.adminAuditLog.create({
      data: {
        adminId: currentUserRecord.id,
        action: 'ASSIGN_ROLE',
        targetType: 'USER',
        targetId: userId,
        details: {
          roleAssigned: targetRole.name,
          previousRole: currentUserRecord.role?.name || 'None'
        }
      }
    });

    return NextResponse.json({ 
      message: 'Role assigned successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error assigning role:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}