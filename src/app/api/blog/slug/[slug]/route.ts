import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteParamsPromise = Promise<{ slug: string }>;

// GET /api/blog/[slug] - Public endpoint to get a post by slug
export async function GET(
  request: NextRequest,
  { params }: { params: RouteParamsPromise }
) {
  // Check if DATABASE_URL is available (for build-time safety)
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ DATABASE_URL not available, returning mock response for build');
    return NextResponse.json({ error: 'Database not available during build' }, { status: 503 });
  }

  try {
    const { slug } = await params;
    const post = await prisma.blogPost.findUnique({
      where: { slug },
    });
    if (!post || !post.published) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error fetching blog post by slug:', error);
    return NextResponse.json({ error: 'Failed to fetch blog post' }, { status: 500 });
  }
}