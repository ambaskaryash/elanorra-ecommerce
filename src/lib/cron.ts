// Cron job utilities for automated email marketing
import { prisma } from '@/lib/prisma';

interface CronJobConfig {
  name: string;
  schedule: string; // cron expression
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

class CronJobManager {
  private jobs: Map<string, CronJobConfig> = new Map();

  constructor() {
    this.initializeJobs();
  }

  private initializeJobs() {
    // Weekly newsletter job - runs every Monday at 9 AM
    this.jobs.set('weekly-newsletter', {
      name: 'Weekly Newsletter',
      schedule: '0 9 * * 1', // Every Monday at 9:00 AM
      enabled: true,
    });

    // Monthly product showcase - runs first Monday of each month at 10 AM
    this.jobs.set('monthly-showcase', {
      name: 'Monthly Product Showcase',
      schedule: '0 10 1-7 * 1', // First Monday of each month at 10:00 AM
      enabled: true,
    });

    // Flash sale notifications - runs Fridays at 2 PM
    this.jobs.set('flash-sale', {
      name: 'Flash Sale Notifications',
      schedule: '0 14 * * 5', // Every Friday at 2:00 PM
      enabled: false, // Disabled by default, enable when needed
    });
  }

  async scheduleWeeklyNewsletter(): Promise<boolean> {
    try {
      // Get current week number
      const currentWeek = Math.ceil((Date.now() - new Date(2024, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
      
      // Check if newsletter was already sent this week
      const lastNewsletter = await prisma.newsletter.findFirst({
        where: {
          subject: {
            contains: `Weekly #${currentWeek}`,
          },
        },
        orderBy: {
          sentAt: 'desc',
        },
      });

      if (lastNewsletter && this.isThisWeek(lastNewsletter.sentAt)) {
        console.log(`Weekly newsletter #${currentWeek} already sent this week`);
        return false;
      }

      // Get sample products for the newsletter
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

      // Prepare newsletter data
      const newsletterData = {
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
            title: "Weekly Special - 20% Off Selected Items",
            description: "Discover our handpicked selection of premium furniture and décor at special prices. Limited time offer.",
            code: "WEEKLY20",
            link: `${process.env.NEXTAUTH_URL}/sale`,
            ctaText: "Shop Now",
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

      // Send the newsletter via API call
      const response = await fetch(`${process.env.NEXTAUTH_URL}/api/newsletter/weekly`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newsletterData),
      });

      if (response.ok) {
        console.log(`Weekly newsletter #${currentWeek} scheduled successfully`);
        return true;
      } else {
        console.error('Failed to schedule weekly newsletter:', await response.text());
        return false;
      }

    } catch (error) {
      console.error('Error scheduling weekly newsletter:', error);
      return false;
    }
  }

  async scheduleFlashSaleNotification(saleData: {
    title: string;
    description: string;
    code?: string;
    link: string;
    endDate: Date;
  }): Promise<boolean> {
    try {
      const newsletterData = {
        weekNumber: Math.ceil((Date.now() - new Date(2024, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)),
        specialOffers: [
          {
            title: saleData.title,
            description: saleData.description,
            code: saleData.code,
            link: saleData.link,
            ctaText: "Shop Flash Sale",
          },
        ],
        featuredProducts: [],
        newArrivals: [],
        designTips: [],
        blogPosts: [],
      };

      const response = await fetch(`${process.env.NEXTAUTH_URL}/api/newsletter/weekly`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newsletterData),
      });

      if (response.ok) {
        console.log('Flash sale notification sent successfully');
        return true;
      } else {
        console.error('Failed to send flash sale notification:', await response.text());
        return false;
      }

    } catch (error) {
      console.error('Error sending flash sale notification:', error);
      return false;
    }
  }

  private isThisWeek(date: Date): boolean {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
    
    return date >= startOfWeek && date <= endOfWeek;
  }

  getJobConfig(jobName: string): CronJobConfig | undefined {
    return this.jobs.get(jobName);
  }

  enableJob(jobName: string): boolean {
    const job = this.jobs.get(jobName);
    if (job) {
      job.enabled = true;
      return true;
    }
    return false;
  }

  disableJob(jobName: string): boolean {
    const job = this.jobs.get(jobName);
    if (job) {
      job.enabled = false;
      return true;
    }
    return false;
  }

  getAllJobs(): CronJobConfig[] {
    return Array.from(this.jobs.values());
  }
}

export const cronJobManager = new CronJobManager();

// Export functions for manual triggering
export async function triggerWeeklyNewsletter(): Promise<boolean> {
  return cronJobManager.scheduleWeeklyNewsletter();
}

export async function triggerFlashSale(saleData: {
  title: string;
  description: string;
  code?: string;
  link: string;
  endDate: Date;
}): Promise<boolean> {
  return cronJobManager.scheduleFlashSaleNotification(saleData);
}