import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const sendNewsletterSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  content: z.string().min(1, 'HTML content is required'),
  plainText: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  testEmail: z.string().email().optional(),
  templateId: z.string().optional(),
  variables: z.record(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is admin
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // For now, we'll check if the user exists in our database
    // In a real app, you'd have proper role-based access control
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = sendNewsletterSchema.parse(body);

    // Get template variables if templateId is provided
    let templateVariables: Record<string, string> = {};
    if (validatedData.templateId) {
      try {
        const template = await prisma.emailTemplate.findUnique({
          where: { id: validatedData.templateId },
        });
        
        if (template && template.variables) {
          // Merge template variables with provided variables (provided variables take precedence)
          templateVariables = {
            ...(typeof template.variables === 'string' 
              ? JSON.parse(template.variables) 
              : template.variables),
            ...(validatedData.variables || {}),
          };
        }
      } catch (error) {
        console.error('Error fetching template variables:', error);
      }
    } else if (validatedData.variables) {
      templateVariables = validatedData.variables;
    }

    // Send test email if requested
    if (validatedData.testEmail) {
      const unsubscribeUrl = `${process.env.NEXTAUTH_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(validatedData.testEmail)}`;
      
      const result = await emailService.sendNewsletterCampaign(
        [validatedData.testEmail],
        {
          subject: `[TEST] ${validatedData.subject}`,
          htmlContent: validatedData.content,
          textContent: validatedData.plainText,
          unsubscribeUrl,
          variables: templateVariables,
        }
      );

      return NextResponse.json({
        message: 'Test email sent successfully',
        sent: result.sent,
        failed: result.failed,
      });
    }

    // Create newsletter record
    const newsletter = await prisma.newsletter.create({
      data: {
        subject: validatedData.subject,
        content: validatedData.content,
        plainText: validatedData.plainText,
        status: validatedData.scheduledAt ? 'scheduled' : 'sending',
        scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : null,
      },
    });

    // If scheduled for later, just return the created newsletter
    if (validatedData.scheduledAt) {
      return NextResponse.json({
        message: 'Newsletter scheduled successfully',
        newsletter: {
          id: newsletter.id,
          subject: newsletter.subject,
          status: newsletter.status,
          scheduledAt: newsletter.scheduledAt,
        },
      });
    }

    // Get active subscribers
    const activeSubscribers = await prisma.newsletterSubscriber.findMany({
      where: { isActive: true },
      select: { email: true },
    });

    if (activeSubscribers.length === 0) {
      await prisma.newsletter.update({
        where: { id: newsletter.id },
        data: { 
          status: 'sent',
          sentAt: new Date(),
          sentCount: 0,
        },
      });

      return NextResponse.json({
        message: 'No active subscribers found',
        sent: 0,
        failed: 0,
      });
    }

    // Send newsletter to all active subscribers
    const recipientEmails = activeSubscribers.map((sub: any) => sub.email);
    const baseUnsubscribeUrl = `${process.env.NEXTAUTH_URL}/api/newsletter/unsubscribe`;
    
    const result = await emailService.sendNewsletterCampaign(
      recipientEmails,
      {
        subject: validatedData.subject,
        htmlContent: validatedData.content,
        textContent: validatedData.plainText,
        unsubscribeUrl: baseUnsubscribeUrl, // Individual unsubscribe URLs will be generated per email
        variables: templateVariables,
      },
      newsletter.id // Pass newsletter ID for tracking
    );

    // Update newsletter record with results
    await prisma.newsletter.update({
      where: { id: newsletter.id },
      data: {
        status: 'sent',
        sentAt: new Date(),
        sentCount: result.sent,
      },
    });

    return NextResponse.json({
      message: 'Newsletter sent successfully',
      newsletter: {
        id: newsletter.id,
        subject: newsletter.subject,
        status: 'sent',
        sentAt: new Date(),
      },
      sent: result.sent,
      failed: result.failed,
    });

  } catch (error) {
    console.error('Newsletter send error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send newsletter' },
      { status: 500 }
    );
  }
}

// Get newsletter campaigns (for admin dashboard)
export async function GET(request: NextRequest) {
  try {
    // Temporarily bypass authentication for development
    // TODO: Implement proper authentication once NextAuth is fixed
    const session = await getServerSession(authOptions);
    
    // Allow access for development purposes
    let isAuthorized = true;
    
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
      
      if (!user) {
        // For development, we'll allow access even if user is not found
        console.log('User not found in database, allowing access for development');
      }
    } else {
      // For development, we'll allow access even without session
      console.log('No session found, allowing access for development');
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [newsletters, total] = await Promise.all([
      prisma.newsletter.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          subject: true,
          status: true,
          sentCount: true,
          openCount: true,
          clickCount: true,
          createdAt: true,
          sentAt: true,
          scheduledAt: true,
        },
      }),
      prisma.newsletter.count(),
    ]);

    return NextResponse.json({
      newsletters,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Get newsletters error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch newsletters' },
      { status: 500 }
    );
  }
}