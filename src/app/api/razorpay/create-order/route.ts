import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { z } from 'zod';

// Validation schema
const createOrderSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  currency: z.string().default('INR'),
  customer: z.object({
    name: z.string().min(1, 'Customer name is required'),
    email: z.string().email('Valid email is required'),
    contact: z.string().regex(/^[0-9]{10}$/, 'Valid 10-digit phone number is required'),
  }),
  receipt: z.string().optional(),
  notes: z.record(z.string()).optional(),
});

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = createOrderSchema.parse(body);

    const { amount, currency, customer, receipt, notes } = validatedData;

    // Additional validation for amount limits
    const amountInPaise = Math.round(amount * 100);
    if (amountInPaise < 100) { // Minimum 1 rupee
      return NextResponse.json(
        { error: 'Minimum order amount is ₹1' },
        { status: 400 }
      );
    }

    if (amountInPaise > 1500000000) { // Maximum 15 crore rupees
      return NextResponse.json(
        { error: 'Maximum order amount is ₹15,00,00,000' },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const orderOptions = {
      amount: amountInPaise,
      currency,
      receipt: receipt || `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      notes: {
        customer_name: customer.name,
        customer_email: customer.email,
        customer_contact: customer.contact,
        ...notes,
      },
    };

    const order = await razorpay.orders.create(orderOptions);

    // Log successful order creation for monitoring
    console.log(`Razorpay order created: ${order.id} for amount: ₹${amount}`);

    return NextResponse.json({
      success: true,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
      receipt: order.receipt,
      created_at: order.created_at,
    });

  } catch (error: any) {
    console.error('Razorpay order creation failed:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
          success: false 
        },
        { status: 400 }
      );
    }

    // Handle Razorpay API errors
    if (error.statusCode) {
      return NextResponse.json(
        { 
          error: 'Razorpay API error',
          message: error.error?.description || error.message,
          code: error.error?.code,
          success: false 
        },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create order', 
        message: 'An unexpected error occurred. Please try again.',
        success: false 
      },
      { status: 500 }
    );
  }
}