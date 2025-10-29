import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for admin role updates
const adminRoleSchema = z.object({
  userId: z.string(),
  isAdmin: z.boolean(),
});

// GET - List all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if current user is admin
    const currentUserRecord = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { isAdmin: true, id: true }
    });

    if (!currentUserRecord?.isAdmin) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    const whereClause = search ? {
      OR: [
        { email: { contains: search, mode: 'insensitive' as const } },
        { firstName: { contains: search, mode: 'insensitive' as const } },
        { lastName: { contains: search, mode: 'insensitive' as const } },
      ]
    } : {};

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          clerkId: true,
          email: true,
          firstName: true,
          lastName: true,
          isAdmin: true,
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where: whereClause })
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create or sync user from Clerk (admin only)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if current user is admin
    const currentUserRecord = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { isAdmin: true, id: true }
    });

    if (!currentUserRecord?.isAdmin) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    const body = await request.json();
    const { clerkUserId } = body;

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Clerk user ID is required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: clerkUserId }
    });

    if (existingUser) {
      return NextResponse.json({ 
        message: 'User already exists in database',
        user: existingUser 
      });
    }

    // Fetch user data from Clerk (this would need to be implemented with Clerk's backend API)
    // For now, we'll create a basic user record
    const newUser = await prisma.user.create({
      data: {
        clerkId: clerkUserId,
        email: `user-${clerkUserId}@example.com`, // This should be fetched from Clerk
        isAdmin: false,
      },
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        isAdmin: true,
        createdAt: true,
      }
    });

    return NextResponse.json({ 
      message: 'User created successfully',
      user: newUser 
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update user admin status (admin only)
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if current user is admin
    const currentUserRecord = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { isAdmin: true, id: true }
    });

    if (!currentUserRecord?.isAdmin) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = adminRoleSchema.parse(body);

    // Prevent users from removing their own admin privileges
    if (validatedData.userId === currentUserRecord.id && !validatedData.isAdmin) {
      return NextResponse.json({ 
        error: 'Cannot remove your own admin privileges' 
      }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: validatedData.userId },
      data: { isAdmin: validatedData.isAdmin },
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        isAdmin: true,
        updatedAt: true,
      }
    });

    // Log the admin action
    await prisma.adminAuditLog.create({
      data: {
        adminId: currentUserRecord.id,
        action: validatedData.isAdmin ? 'GRANT_ADMIN' : 'REVOKE_ADMIN',
        resource: 'USER',
        resourceId: validatedData.userId,
        details: {
          targetUserEmail: updatedUser.email,
          newAdminStatus: validatedData.isAdmin
        }
      }
    });

    return NextResponse.json({
      message: `User admin status ${validatedData.isAdmin ? 'granted' : 'revoked'} successfully`,
      user: updatedUser
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: error.issues 
      }, { status: 400 });
    }

    console.error('Error updating user admin status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}