import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { 
      productId, 
      launchDate, 
      specialOffer,
      launchMessage,
      discountCode,
      discountPercentage 
    } = await request.json();

    // Validate required fields
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Get product details
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get all active newsletter subscribers
    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: {
        isActive: true,
      },
      select: {
        email: true,
        firstName: true,
        lastName: true,
        id: true,
      },
    });

    if (subscribers.length === 0) {
      return NextResponse.json(
        { message: 'No active subscribers found' },
        { status: 200 }
      );
    }

    let successCount = 0;
    let failureCount = 0;
    const failedEmails: string[] = [];

    // Get related products from the same category
    const relatedProducts = await prisma.product.findMany({
      where: {
        category: product.category,
        id: { not: productId },
      },
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        images: true,
      },
    });

    // Prepare newsletter data for product launch
    const currentWeek = Math.ceil((Date.now() - new Date(2024, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
    
    const newsletterData = {
      weekNumber: currentWeek,
      specialOffers: [
        {
          title: `🚀 New Launch: ${product.name}`,
          description: `Be the first to experience our latest addition. ${launchMessage || 'Discover innovation and style combined.'}`,
          code: discountCode || 'LAUNCH15',
          link: `${process.env.NEXTAUTH_URL}/products/${product.slug}?utm_source=email&utm_medium=product_launch&utm_campaign=new_launch`,
          ctaText: 'Shop New Launch',
        },
      ],
      featuredProducts: [
        {
          name: product.name,
          price: discountPercentage ? Math.round(product.price * (1 - discountPercentage / 100)) : product.price,
          description: product.description?.substring(0, 100) + '...',
          image: product.images?.[0]?.src || undefined,
          link: `${process.env.NEXTAUTH_URL}/products/${product.slug}?utm_source=email&utm_medium=product_launch&utm_campaign=featured`,
        },
        ...relatedProducts.slice(0, 2).map((p: any) => ({
          name: p.name,
          price: p.price,
          description: p.description?.substring(0, 100) + '...',
          image: p.images?.[0]?.src || undefined,
          link: `${process.env.NEXTAUTH_URL}/products/${p.slug}?utm_source=email&utm_medium=product_launch&utm_campaign=related`,
        })),
      ],
      newArrivals: relatedProducts.slice(2, 5).map((p: any) => ({
        name: p.name,
        price: p.price,
        description: p.description?.substring(0, 100) + '...',
        image: p.images?.[0]?.src || undefined,
        link: `${process.env.NEXTAUTH_URL}/products/${p.slug}?utm_source=email&utm_medium=product_launch&utm_campaign=new_arrivals`,
      })),
      designTips: [
        {
          title: `Styling Your New ${product.category?.name || 'Furniture'}`,
          content: `Discover expert tips on how to incorporate ${product.name} into your existing décor for maximum impact and style.`,
          link: `${process.env.NEXTAUTH_URL}/blog/styling-${product.category?.name?.toLowerCase() || 'furniture'}`,
        },
      ],
      blogPosts: [
        {
          title: `Introducing ${product.name}: The Perfect Addition to Your Home`,
          excerpt: `Learn about the craftsmanship, design inspiration, and versatility that makes ${product.name} a must-have piece.`,
          link: `${process.env.NEXTAUTH_URL}/blog/introducing-${product.slug}`,
        },
      ],
    };

    // Send product launch notification to each subscriber
    for (const subscriber of subscribers) {
      try {
        const unsubscribeUrl = `${process.env.NEXTAUTH_URL}/api/newsletter/unsubscribe?token=${subscriber.id}&email=${encodeURIComponent(subscriber.email)}`;
        
        const success = await emailService.sendWeeklyNewsletter({
          email: subscriber.email,
          firstName: subscriber.firstName || undefined,
          lastName: subscriber.lastName || undefined,
          unsubscribeUrl,
          ...newsletterData,
        });

        if (success) {
          successCount++;
        } else {
          failureCount++;
          failedEmails.push(subscriber.email);
        }
      } catch (error) {
        console.error(`Failed to send product launch notification to ${subscriber.email}:`, error);
        failureCount++;
        failedEmails.push(subscriber.email);
      }
    }

    // Log the marketing campaign
    try {
      await prisma.newsletter.create({
        data: {
          subject: `🚀 New Launch: ${product.name} - Exclusive First Access!`,
          content: JSON.stringify({
            type: 'product_launch',
            productId: product.id,
            productName: product.name,
            launchDate,
            specialOffer,
            ...newsletterData,
          }),
          sentAt: new Date(),
          recipientCount: successCount,
        },
      });
    } catch (error) {
      console.error('Failed to log product launch campaign:', error);
    }

    return NextResponse.json({
      message: 'Product launch notification sent successfully',
      product: {
        id: product.id,
        name: product.name,
        category: product.category?.name,
      },
      stats: {
        totalSubscribers: subscribers.length,
        successCount,
        failureCount,
        failedEmails: failedEmails.length > 0 ? failedEmails : undefined,
      },
    });

  } catch (error) {
    console.error('Error sending product launch notification:', error);
    return NextResponse.json(
      { error: 'Failed to send product launch notification' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch recent products for launch campaigns
export async function GET() {
  try {
    const recentProducts = await prisma.product.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        price: true,
        description: true,
        images: true,
        slug: true,
        createdAt: true,
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Recent products for launch campaigns',
      products: recentProducts,
      subscriberCount: await prisma.newsletterSubscriber.count({
        where: { isActive: true },
      }),
    });

  } catch (error) {
    console.error('Error fetching recent products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent products' },
      { status: 500 }
    );
  }
}