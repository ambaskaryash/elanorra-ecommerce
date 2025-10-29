import { NextRequest, NextResponse } from 'next/server';
import { sendAbandonedCartEmail, trackCartAbandonment } from '@/lib/email';
import { z } from 'zod';

// Schema for abandoned cart email request
const abandonedCartSchema = z.object({
  email: z.string().email('Invalid email address'),
  customerName: z.string().min(1, 'Customer name is required'),
  cartId: z.string().min(1, 'Cart ID is required'),
  items: z.array(z.object({
    productId: z.string(),
    name: z.string(),
    slug: z.string(),
    price: z.number(),
    quantity: z.number(),
    image: z.string().optional(),
    url: z.string().optional(),
  })),
  subtotal: z.number(),
  cartUrl: z.string().url('Invalid cart URL'),
  abandonedAt: z.string().datetime().optional(),
  customerData: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = abandonedCartSchema.parse(body);
    
    // Convert abandonedAt string to Date if provided, otherwise use current date
    const emailData = {
      ...validatedData,
      abandonedAt: validatedData.abandonedAt ? new Date(validatedData.abandonedAt) : new Date(),
    };
    
    // Send abandoned cart email
    const success = await sendAbandonedCartEmail(emailData);
    
    if (success) {
      return NextResponse.json(
        { message: 'Abandoned cart email sent successfully' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to send abandoned cart email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending abandoned cart email:', error);
    
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

// Track cart abandonment endpoint
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = abandonedCartSchema.parse(body);
    
    // Convert abandonedAt string to Date if provided, otherwise use current date
    const emailData = {
      ...validatedData,
      abandonedAt: validatedData.abandonedAt ? new Date(validatedData.abandonedAt) : new Date(),
    };
    
    // Track cart abandonment (this will also send the email)
    await trackCartAbandonment(emailData);
    
    return NextResponse.json(
      { message: 'Cart abandonment tracked successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error tracking cart abandonment:', error);
    
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