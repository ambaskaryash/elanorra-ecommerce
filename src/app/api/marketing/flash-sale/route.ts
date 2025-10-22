import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { 
      title, 
      description, 
      discountPercentage, 
      code, 
      endDate, 
      categoryIds = [], 
      productIds = [],
      urgencyMessage 
    } = await request.json();

    // Validate required fields
    if (!title || !description || !discountPercentage || !endDate) {
      return NextResponse.json(
        { error: 'Title, description, discount percentage, and end date are required' },
        { status: 400 }
      );
    }

    // Get featured products for the sale
    let saleProducts = [];
    
    if (productIds.length > 0) {
      // Get specific products
      saleProducts = await prisma.product.findMany({
        where: {
          id: { in: productIds },
        },
        take: 6,
        include: {
          images: true,
        },
      });
    } else if (categoryIds.length > 0) {
      // Get products from specific categories
      saleProducts = await prisma.product.findMany({
        where: {
          category: { in: categoryIds },
        },
        take: 6,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          images: true,
        },
      });
    } else {
      // Get random featured products
      saleProducts = await prisma.product.findMany({
        take: 6,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          images: true,
        },
      });
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

    // Calculate sale end time for urgency
    const saleEndDate = new Date(endDate);
    const timeRemaining = Math.ceil((saleEndDate.getTime() - Date.now()) / (1000 * 60 * 60)); // hours remaining
    
    // Prepare newsletter data for flash sale
    const currentWeek = Math.ceil((Date.now() - new Date(2024, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
    
    const newsletterData = {
      weekNumber: currentWeek,
      specialOffers: [
        {
          title: `🔥 ${title} - ${discountPercentage}% OFF`,
          description: `${description} ${urgencyMessage || `Hurry! Only ${timeRemaining} hours left!`}`,
          code: code || 'FLASH' + discountPercentage,
          link: `${process.env.NEXTAUTH_URL}/sale?utm_source=email&utm_medium=flash_sale&utm_campaign=${encodeURIComponent(title.toLowerCase().replace(/\s+/g, '_'))}`,
          ctaText: 'Shop Flash Sale',
        },
      ],
      featuredProducts: saleProducts.slice(0, 3).map((product: any) => ({
        name: product.name,
        price: Math.round(product.price * (1 - discountPercentage / 100)), // Show discounted price
        description: product.description?.substring(0, 100) + '...',
        image: product.images?.[0]?.src || undefined,
        link: `${process.env.NEXTAUTH_URL}/products/${product.slug}?utm_source=email&utm_medium=flash_sale&utm_campaign=featured`,
      })),
      newArrivals: saleProducts.slice(3, 6).map((product: any) => ({
        name: product.name,
        price: Math.round(product.price * (1 - discountPercentage / 100)), // Show discounted price
        description: product.description?.substring(0, 100) + '...',
        image: product.images?.[0]?.src || undefined,
        link: `${process.env.NEXTAUTH_URL}/products/${product.slug}?utm_source=email&utm_medium=flash_sale&utm_campaign=new_arrivals`,
      })),
      designTips: [
        {
          title: "Flash Sale Shopping Tips",
          content: "Make the most of our flash sale by creating a wishlist beforehand and acting fast on your favorite pieces. Limited quantities available!",
          link: `${process.env.NEXTAUTH_URL}/blog/flash-sale-tips`,
        },
      ],
      blogPosts: [
        {
          title: "How to Style Sale Finds Like a Pro",
          excerpt: "Expert tips on incorporating discounted pieces into your existing décor for a cohesive, luxury look.",
          link: `${process.env.NEXTAUTH_URL}/blog/styling-sale-finds`,
        },
      ],
    };

    // Send flash sale notification to each subscriber
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
        console.error(`Failed to send flash sale notification to ${subscriber.email}:`, error);
        failureCount++;
        failedEmails.push(subscriber.email);
      }
    }

    // Log the marketing campaign
    try {
      await prisma.newsletter.create({
        data: {
          subject: `🔥 ${title} - ${discountPercentage}% OFF - Limited Time!`,
          content: JSON.stringify({
            type: 'flash_sale',
            title,
            description,
            discountPercentage,
            code,
            endDate,
            categoryIds,
            productIds,
            urgencyMessage,
            ...newsletterData,
          }),
          sentAt: new Date(),
          recipientCount: successCount,
        },
      });
    } catch (error) {
      console.error('Failed to log flash sale campaign:', error);
    }

    return NextResponse.json({
      message: 'Flash sale notification sent successfully',
      sale: {
        title,
        discountPercentage,
        code,
        endDate,
        productsIncluded: saleProducts.length,
      },
      stats: {
        totalSubscribers: subscribers.length,
        successCount,
        failureCount,
        failedEmails: failedEmails.length > 0 ? failedEmails : undefined,
      },
    });

  } catch (error) {
    console.error('Error sending flash sale notification:', error);
    return NextResponse.json(
      { error: 'Failed to send flash sale notification' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch categories and products for sale setup
export async function GET() {
  try {
    const [categories, products] = await Promise.all([
      prisma.category.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              products: true,
            },
          },
        },
      }),
      prisma.product.findMany({
        take: 20,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          name: true,
          price: true,
          images: true,
          slug: true,
          category: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      message: 'Categories and products for flash sale setup',
      categories,
      products,
      subscriberCount: await prisma.newsletterSubscriber.count({
        where: { isActive: true },
      }),
    });

  } catch (error) {
    console.error('Error fetching sale setup data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sale setup data' },
      { status: 500 }
    );
  }
}