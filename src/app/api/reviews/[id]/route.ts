import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { rateLimit, rateLimitConfigs, createRateLimitResponse } from '@/lib/rate-limit';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const limiter = rateLimit(rateLimitConfigs.api);
    const rateResult = await limiter(request);
    if (!rateResult.success) {
      return createRateLimitResponse(rateResult.error!, rateResult.resetTime!);
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reviewId = params.id;
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { role: true },
    });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isAdmin = !!dbUser.role && dbUser.role.level <= 2;
    const isOwner = review.userId === dbUser.id;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the review
    await prisma.review.delete({ where: { id: reviewId } });

    // Recalculate product rating and review count
    if (review.productId) {
      const productReviews = await prisma.review.findMany({
        where: { productId: review.productId },
        select: { rating: true },
      });
      const totalRating = productReviews.reduce(
        (sum: number, r: { rating: number }) => sum + r.rating,
        0
      );
      const newReviewCount = productReviews.length;
      const newAvgRating = newReviewCount > 0 ? totalRating / newReviewCount : 0;

      await prisma.product.update({
        where: { id: review.productId },
        data: {
          avgRating: newAvgRating,
          reviewCount: newReviewCount,
        },
      });
    }

    return NextResponse.json({ message: 'Review deleted', deletedId: reviewId }, { status: 200 });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}

// PATCH /api/reviews/[id] - Update a review (owner-only, admins allowed)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const limiter = rateLimit(rateLimitConfigs.api);
    const rateResult = await limiter(request);
    if (!rateResult.success) {
      return createRateLimitResponse(rateResult.error!, rateResult.resetTime!);
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reviewId = params.id;
    const existing = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!existing) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId }, include: { role: true } });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isAdmin = !!dbUser.role && dbUser.role.level <= 2;
    const isOwner = existing.userId === dbUser.id;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const updateSchema = z.object({
      rating: z.number().int().min(1).max(5).optional(),
      title: z.string().min(1).optional(),
      comment: z.string().min(1).optional(),
    });
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    // Apply updates
    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: {
        ...parsed.data,
      },
    });

    // Recalculate product rating and review count
    if (updated.productId) {
      const productReviews = await prisma.review.findMany({
        where: { productId: updated.productId },
        select: { rating: true },
      });
      const totalRating = productReviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0);
      const newReviewCount = productReviews.length;
      const newAvgRating = newReviewCount > 0 ? totalRating / newReviewCount : 0;

      await prisma.product.update({
        where: { id: updated.productId },
        data: { avgRating: newAvgRating, reviewCount: newReviewCount },
      });
    }

    return NextResponse.json({ review: updated }, { status: 200 });
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
}