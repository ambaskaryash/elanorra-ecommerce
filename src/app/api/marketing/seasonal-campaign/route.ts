import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { 
      campaignName,
      season,
      theme,
      discountPercentage,
      code,
      endDate,
      categoryIds = [],
      customMessage,
      targetAudience = 'all'
    } = await request.json();

    // Validate required fields
    if (!campaignName || !season || !theme) {
      return NextResponse.json(
        { error: 'Campaign name, season, and theme are required' },
        { status: 400 }
      );
    }

    // Get seasonal products based on categories or general selection
    let seasonalProducts = [];
    
    if (categoryIds.length > 0) {
      seasonalProducts = await prisma.product.findMany({
        where: {
          category: { in: categoryIds },
        },
        take: 8,
        orderBy: [
          { createdAt: 'desc' },
          { name: 'asc' }
        ],
        include: {
          images: true,
        },
      });
    } else {
      // Get featured products for the season
      seasonalProducts = await prisma.product.findMany({
        take: 8,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          images: true,
        },
      });
    }

    // Get subscribers based on target audience
    let subscriberQuery: any = {
      isActive: true,
    };

    // You could extend this to filter by subscriber preferences, purchase history, etc.
    if (targetAudience === 'recent') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      subscriberQuery.createdAt = {
        gte: thirtyDaysAgo,
      };
    }

    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: subscriberQuery,
      select: {
        email: true,
        firstName: true,
        lastName: true,
        id: true,
      },
    });

    if (subscribers.length === 0) {
      return NextResponse.json(
        { message: 'No active subscribers found for target audience' },
        { status: 200 }
      );
    }

    let successCount = 0;
    let failureCount = 0;
    const failedEmails: string[] = [];

    // Prepare seasonal campaign data
    const currentWeek = Math.ceil((Date.now() - new Date(2024, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
    
    // Create seasonal themes and content
    const seasonalThemes: Record<string, any> = {
      spring: {
        emoji: '🌸',
        colors: 'fresh greens and soft pastels',
        mood: 'renewal and fresh beginnings',
        tips: 'Brighten your space with light fabrics and natural elements'
      },
      summer: {
        emoji: '☀️',
        colors: 'bright whites and ocean blues',
        mood: 'relaxation and outdoor living',
        tips: 'Create cool, airy spaces perfect for summer entertaining'
      },
      fall: {
        emoji: '🍂',
        colors: 'warm oranges and deep burgundies',
        mood: 'cozy comfort and gathering',
        tips: 'Layer textures and warm tones for the perfect autumn ambiance'
      },
      winter: {
        emoji: '❄️',
        colors: 'rich jewel tones and metallic accents',
        mood: 'luxury and intimate gatherings',
        tips: 'Add warmth with plush textures and ambient lighting'
      },
      holiday: {
        emoji: '🎄',
        colors: 'festive reds and elegant golds',
        mood: 'celebration and joy',
        tips: 'Transform your home into a holiday haven with elegant décor'
      }
    };

    const themeData = seasonalThemes[season.toLowerCase()] || seasonalThemes.spring;

    const newsletterData = {
      weekNumber: currentWeek,
      specialOffers: [
        {
          title: `${themeData.emoji} ${campaignName} - ${discountPercentage ? `${discountPercentage}% OFF` : 'Special Pricing'}`,
          description: `${customMessage || `Embrace the ${themeData.mood} with our curated ${season} collection. Discover pieces that capture the essence of the season.`}`,
          code: code || season.toUpperCase() + (discountPercentage || ''),
          link: `${process.env.NEXTAUTH_URL}/collections/${season}?utm_source=email&utm_medium=seasonal_campaign&utm_campaign=${encodeURIComponent(campaignName.toLowerCase().replace(/\s+/g, '_'))}`,
          ctaText: `Shop ${season} Collection`,
        },
      ],
      featuredProducts: seasonalProducts.slice(0, 4).map((product: any) => ({
        name: product.name,
        price: discountPercentage ? Math.round(product.price * (1 - discountPercentage / 100)) : product.price,
        description: product.description?.substring(0, 100) + '...',
        image: product.images?.[0]?.src || undefined,
        link: `${process.env.NEXTAUTH_URL}/products/${product.slug}?utm_source=email&utm_medium=seasonal_campaign&utm_campaign=featured`,
      })),
      newArrivals: seasonalProducts.slice(4, 8).map((product: any) => ({
        name: product.name,
        price: discountPercentage ? Math.round(product.price * (1 - discountPercentage / 100)) : product.price,
        description: product.description?.substring(0, 100) + '...',
        image: product.images?.[0]?.src || undefined,
        link: `${process.env.NEXTAUTH_URL}/products/${product.slug}?utm_source=email&utm_medium=seasonal_campaign&utm_campaign=new_arrivals`,
      })),
      designTips: [
        {
          title: `${season} Design Inspiration`,
          content: `${themeData.tips}. Incorporate ${themeData.colors} to perfectly capture the ${season} aesthetic.`,
          link: `${process.env.NEXTAUTH_URL}/blog/${season}-design-tips`,
        },
        {
          title: `Trending ${season} Styles`,
          content: `Discover the latest trends that define ${season} luxury living and how to incorporate them into your home.`,
          link: `${process.env.NEXTAUTH_URL}/blog/${season}-trends`,
        },
      ],
      blogPosts: [
        {
          title: `${season} Home Transformation Guide`,
          excerpt: `Complete guide to refreshing your space for ${season} with expert tips and product recommendations.`,
          link: `${process.env.NEXTAUTH_URL}/blog/${season}-transformation-guide`,
        },
        {
          title: `Color Palette: ${season} Edition`,
          excerpt: `Explore the perfect color combinations that capture the essence of ${season} in luxury home design.`,
          link: `${process.env.NEXTAUTH_URL}/blog/${season}-color-palette`,
        },
      ],
    };

    // Send seasonal campaign to each subscriber
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
        console.error(`Failed to send seasonal campaign to ${subscriber.email}:`, error);
        failureCount++;
        failedEmails.push(subscriber.email);
      }
    }

    // Log the seasonal campaign
    try {
      await prisma.newsletter.create({
        data: {
          subject: `${themeData.emoji} ${campaignName} - Discover ${season} Luxury`,
          content: JSON.stringify({
            type: 'seasonal_campaign',
            campaignName,
            season,
            theme,
            discountPercentage,
            code,
            endDate,
            categoryIds,
            customMessage,
            targetAudience,
            ...newsletterData,
          }),
          sentAt: new Date(),
          recipientCount: successCount,
        },
      });
    } catch (error) {
      console.error('Failed to log seasonal campaign:', error);
    }

    return NextResponse.json({
      message: 'Seasonal campaign sent successfully',
      campaign: {
        name: campaignName,
        season,
        theme,
        discountPercentage,
        code,
        endDate,
        productsIncluded: seasonalProducts.length,
        targetAudience,
      },
      stats: {
        totalSubscribers: subscribers.length,
        successCount,
        failureCount,
        failedEmails: failedEmails.length > 0 ? failedEmails : undefined,
      },
    });

  } catch (error) {
    console.error('Error sending seasonal campaign:', error);
    return NextResponse.json(
      { error: 'Failed to send seasonal campaign' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch seasonal campaign options
export async function GET() {
  try {
    const [categories, recentProducts] = await Promise.all([
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
        take: 12,
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

    const seasons = [
      { value: 'spring', label: 'Spring', emoji: '🌸' },
      { value: 'summer', label: 'Summer', emoji: '☀️' },
      { value: 'fall', label: 'Fall', emoji: '🍂' },
      { value: 'winter', label: 'Winter', emoji: '❄️' },
      { value: 'holiday', label: 'Holiday', emoji: '🎄' },
    ];

    const targetAudiences = [
      { value: 'all', label: 'All Subscribers' },
      { value: 'recent', label: 'Recent Subscribers (Last 30 days)' },
    ];

    return NextResponse.json({
      message: 'Seasonal campaign setup data',
      categories,
      recentProducts,
      seasons,
      targetAudiences,
      subscriberCount: await prisma.newsletterSubscriber.count({
        where: { isActive: true },
      }),
    });

  } catch (error) {
    console.error('Error fetching seasonal campaign data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seasonal campaign data' },
      { status: 500 }
    );
  }
}