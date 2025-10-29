import { NextRequest, NextResponse } from 'next/server';
import { 
  sendVerificationEmail, 
  sendWelcomeEmail, 
  sendPasswordResetEmail,
  sendAbandonedCartEmail,
  sendPromotionalEmail
} from '@/lib/email';
import { z } from 'zod';

// Schema for email test request
const emailTestSchema = z.object({
  type: z.enum(['verification', 'welcome', 'password-reset', 'abandoned-cart', 'promotional']),
  email: z.string().email('Invalid email address'),
  testData: z.object({}).catchall(z.any()).optional(), // Allow any test data structure
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const { type, email, testData } = emailTestSchema.parse(body);
    
    let success = false;
    let message = '';
    
    switch (type) {
      case 'verification':
        success = await sendVerificationEmail(
          email,
          testData?.token || 'test-verification-token-123'
        );
        message = 'Verification email test';
        break;
        
      case 'welcome':
        success = await sendWelcomeEmail(
          email,
          testData?.firstName || 'Test User',
          testData?.verificationToken || 'test-verification-token-123'
        );
        message = 'Welcome email test';
        break;
        
      case 'password-reset':
        success = await sendPasswordResetEmail(
          email,
          testData?.resetToken || 'test-reset-token-123',
          testData?.firstName || 'Test User'
        );
        message = 'Password reset email test';
        break;
        
      case 'abandoned-cart':
        success = await sendAbandonedCartEmail({
          email,
          customerName: testData?.customerName || 'Test Customer',
          cartId: testData?.cartId || 'test-cart-123',
          items: testData?.items || [
            {
              productId: 'test-product-1',
              name: 'Test Product',
              slug: 'test-product',
              price: 29.99,
              quantity: 1,
              image: 'https://via.placeholder.com/150',
              url: 'https://example.com/product/test-product'
            }
          ],
          subtotal: testData?.subtotal || 29.99,
          cartUrl: testData?.cartUrl || 'https://example.com/cart',
          abandonedAt: new Date()
        });
        message = 'Abandoned cart email test';
        break;
        
      case 'promotional':
        success = await sendPromotionalEmail({
          email,
          subject: testData?.subject || 'Test Promotional Email',
          templateData: testData?.templateData || {
            offer: '20% Off Everything!',
            message: 'This is a test promotional email.',
            ctaText: 'Shop Now',
            ctaUrl: 'https://example.com/shop',
            discount_code: 'TEST20'
          },
          campaignId: testData?.campaignId || 'test-campaign-123'
        });
        message = 'Promotional email test';
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        );
    }
    
    if (success) {
      return NextResponse.json(
        { 
          message: `${message} sent successfully to ${email}`,
          type,
          email,
          success: true
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { 
          error: `Failed to send ${message.toLowerCase()} to ${email}`,
          type,
          email,
          success: false
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error testing email:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get email service status
export async function GET() {
  try {
    // Basic health check - you could expand this to check SMTP connection
    const status = {
      service: 'Email Service',
      status: 'operational',
      timestamp: new Date().toISOString(),
      features: {
        verification: 'enabled',
        welcome: 'enabled',
        passwordReset: 'enabled',
        abandonedCart: 'enabled',
        promotional: 'enabled',
        bulkCampaigns: 'enabled'
      },
      transport: 'Nodemailer SMTP'
    };
    
    return NextResponse.json(status, { status: 200 });
  } catch (error) {
    console.error('Error checking email service status:', error);
    
    return NextResponse.json(
      { 
        service: 'Email Service',
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Service unavailable'
      },
      { status: 500 }
    );
  }
}