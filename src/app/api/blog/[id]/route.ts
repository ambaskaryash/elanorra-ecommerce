import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/blog/[id] - Get a specific blog post by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check if DATABASE_URL is available (for build-time safety)
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ DATABASE_URL not available, returning empty response for build');
    return NextResponse.json({ post: null }, { status: 404 });
  }

  try {
    const post = await prisma.blogPost.findUnique({
      where: { id: params.id },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
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

// PUT /api/blog/[id] - Update a blog post (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check if DATABASE_URL is available (for build-time safety)
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ DATABASE_URL not available, returning error for build');
    return NextResponse.json({ error: 'Database not available during build' }, { status: 503 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      slug,
      excerpt,
      content,
      coverImage,
      tags,
      published,
    } = body;

    const existing = await prisma.blogPost.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if slug is being changed and if it conflicts
    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.blogPost.findUnique({ where: { slug } });
      if (slugExists) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
      }
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (content !== undefined) updateData.content = content;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (tags !== undefined) updateData.tags = tags;
    if (published !== undefined) {
      updateData.published = published;
      if (published && !existing.published) {
        updateData.publishedAt = new Date();
      } else if (!published) {
        updateData.publishedAt = null;
      }
    }

    const post = await prisma.blogPost.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error updating blog post:', error);
    return NextResponse.json({ error: 'Failed to update blog post' }, { status: 500 });
  }
}

// DELETE /api/blog/[id] - Delete a blog post (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check if DATABASE_URL is available (for build-time safety)
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ DATABASE_URL not available, returning error for build');
    return NextResponse.json({ error: 'Database not available during build' }, { status: 503 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await prisma.blogPost.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    await prisma.blogPost.delete({ where: { id: params.id } });

    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return NextResponse.json({ error: 'Failed to delete blog post' }, { status: 500 });
  }
}