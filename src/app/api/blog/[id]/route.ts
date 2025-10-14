import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

type RouteParamsPromise = Promise<{ id: string }>;

// GET /api/blog/[id] - Get a single post by ID
export async function GET(
  request: NextRequest,
  { params }: { params: RouteParamsPromise }
) {
  try {
    const { id } = await params;
    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return NextResponse.json({ error: 'Failed to fetch blog post' }, { status: 500 });
  }
}

// PUT /api/blog/[id] - Update a post (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: RouteParamsPromise }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const updates = await request.json();

    // Handle publish toggle and publishedAt
    if (typeof updates.published === 'boolean') {
      updates.publishedAt = updates.published ? new Date() : null;
    }

    const post = await prisma.blogPost.update({
      where: { id },
      data: updates,
    });
    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error updating blog post:', error);
    return NextResponse.json({ error: 'Failed to update blog post' }, { status: 500 });
  }
}

// DELETE /api/blog/[id] - Delete a post (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: RouteParamsPromise }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.blogPost.delete({ where: { id } });
    return NextResponse.json({ message: 'Post deleted' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return NextResponse.json({ error: 'Failed to delete blog post' }, { status: 500 });
  }
}