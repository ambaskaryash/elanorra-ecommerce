import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Parse request body if present, otherwise use defaults
    let requestData = {};
    try {
      const body = await request.text();
      if (body.trim()) {
        requestData = JSON.parse(body);
      }
    } catch (parseError) {
      // If no body or invalid JSON, use defaults
      requestData = {};
    }

    const { 
      weekNumber = Math.ceil((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)), 
      featuredProducts, 
      designTips, 
      specialOffers, 
      blogPosts, 
      newArrivals 
    } = requestData as any;

    // Validate required fields
    if (!weekNumber) {
      return NextResponse.json(
        { error: 'Week number is required' },
        { status: 400 }
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

    // Send weekly newsletter to each subscriber
    for (const subscriber of subscribers) {
      try {
        const unsubscribeUrl = `${process.env.NEXTAUTH_URL}/api/newsletter/unsubscribe?token=${subscriber.id}&email=${encodeURIComponent(subscriber.email)}`;
        
        const success = await emailService.sendWeeklyNewsletter({
          email: subscriber.email,
          firstName: subscriber.firstName || undefined,
          lastName: subscriber.lastName || undefined,
          unsubscribeUrl,
          weekNumber,
          featuredProducts: featuredProducts || [],
          designTips: designTips || [],
          specialOffers: specialOffers || [],
          blogPosts: blogPosts || [],
          newArrivals: newArrivals || [],
        });

        if (success) {
          successCount++;
        } else {
          failureCount++;
          failedEmails.push(subscriber.email);
        }
      } catch (error) {
        console.error(`Failed to send weekly newsletter to ${subscriber.email}:`, error);
        failureCount++;
        failedEmails.push(subscriber.email);
      }
    }

    // Log the newsletter campaign
    try {
      await prisma.newsletter.create({
        data: {
          subject: `🏡 ElanorraLiving Weekly #${weekNumber} - New Arrivals, Design Tips & Exclusive Offers Inside!`,
          content: JSON.stringify({
            weekNumber,
            featuredProducts,
            designTips,
            specialOffers,
            blogPosts,
            newArrivals,
          }),
          sentAt: new Date(),
          recipientCount: successCount,
        },
      });
    } catch (error) {
      console.error('Failed to log newsletter campaign:', error);
    }

    return NextResponse.json({
      message: 'Weekly newsletter sent successfully',
      stats: {
        totalSubscribers: subscribers.length,
        successCount,
        failureCount,
        failedEmails: failedEmails.length > 0 ? failedEmails : undefined,
      },
    });

  } catch (error) {
    console.error('Error sending weekly newsletter:', error);
    return NextResponse.json(
      { error: 'Failed to send weekly newsletter' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch sample data for testing
export async function GET() {
  try {
    // Get some sample products for the newsletter
    const products = await prisma.product.findMany({
      take: 6,
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
      },
    });

    const currentWeek = Math.ceil((Date.now() - new Date(2024, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));

    const sampleData = {
      weekNumber: currentWeek,
      featuredProducts: products.slice(0, 3).map((product: any) => ({
        name: product.name,
        price: product.price,
        description: product.description?.substring(0, 100) + '...',
        image: product.images?.[0] || undefined,
        link: `${process.env.NEXTAUTH_URL}/products/${product.slug}`,
      })),
      newArrivals: products.slice(3, 6).map((product: any) => ({
        name: product.name,
        price: product.price,
        description: product.description?.substring(0, 100) + '...',
        image: product.images?.[0] || undefined,
        link: `${process.env.NEXTAUTH_URL}/products/${product.slug}`,
      })),
      designTips: [
        {
          title: "Create Cozy Reading Nooks",
          content: "Transform any corner into a peaceful retreat with a comfortable chair, soft lighting, and a small side table for your favorite books and tea.",
          link: `${process.env.NEXTAUTH_URL}/blog/cozy-reading-nooks`,
        },
        {
          title: "Mix Textures for Visual Interest",
          content: "Combine smooth ceramics with rough wood, soft fabrics with metal accents to create depth and sophistication in your space.",
          link: `${process.env.NEXTAUTH_URL}/blog/mixing-textures`,
        },
      ],
      specialOffers: [
        {
          title: "Weekend Flash Sale - 25% Off Living Room Sets",
          description: "Transform your living space with our premium furniture collections. Limited time offer on selected items.",
          code: "WEEKEND25",
          link: `${process.env.NEXTAUTH_URL}/categories/living-room`,
          ctaText: "Shop Sale",
        },
      ],
      blogPosts: [
        {
          title: "2024 Interior Design Trends: What's Hot This Year",
          excerpt: "Discover the latest trends shaping luxury home design, from sustainable materials to bold color palettes.",
          link: `${process.env.NEXTAUTH_URL}/blog/2024-design-trends`,
        },
        {
          title: "How to Style Your Dining Room for Entertaining",
          excerpt: "Expert tips for creating an elegant dining space that's perfect for hosting memorable dinner parties.",
          link: `${process.env.NEXTAUTH_URL}/blog/dining-room-entertaining`,
        },
      ],
    };

    return NextResponse.json({
      message: 'Sample weekly newsletter data',
      data: sampleData,
      subscriberCount: await prisma.newsletterSubscriber.count({
        where: { isActive: true },
      }),
    });

  } catch (error) {
    console.error('Error fetching sample data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sample data' },
      { status: 500 }
    );
  }
}