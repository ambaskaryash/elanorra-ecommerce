import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { z } from 'zod';

// Validation schema
const verifyPaymentSchema = z.object({
  razorpay_payment_id: z.string().min(1, 'Payment ID is required'),
  razorpay_order_id: z.string().min(1, 'Order ID is required'),
  razorpay_signature: z.string().min(1, 'Signature is required'),
  order_data: z.object({
    id: z.string().min(1, 'Order ID is required'),
    email: z.string().email('Valid email is required'),
    amount: z.number().positive('Amount must be positive'),
  }).optional(),
});

interface PaymentData {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  payment_status: string;
  amount: number;
  currency: string;
  method: string;
  email: string;
  contact: string | number;
  created_at: number;
}

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = verifyPaymentSchema.parse(body);

    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      order_data,
    } = validatedData;

    // Create signature for verification
    const body_string = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body_string)
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      console.error(`Payment verification failed for payment ID: ${razorpay_payment_id}`);
      return NextResponse.json(
        { 
          error: 'Payment verification failed - Invalid signature',
          success: false 
        },
        { status: 400 }
      );
    }

    // Fetch payment details from Razorpay
    let payment;
    try {
      payment = await razorpay.payments.fetch(razorpay_payment_id);
    } catch (razorpayError: any) {
      console.error('Failed to fetch payment from Razorpay:', razorpayError);
      return NextResponse.json(
        { 
          error: 'Failed to fetch payment details',
          message: razorpayError.error?.description || 'Payment not found',
          success: false 
        },
        { status: 400 }
      );
    }

    // Verify payment status
    if (payment.status !== 'captured') {
      console.error(`Payment not captured. Status: ${payment.status} for payment ID: ${razorpay_payment_id}`);
      return NextResponse.json(
        { 
          error: 'Payment not successful',
          message: `Payment status: ${payment.status}`,
          success: false 
        },
        { status: 400 }
      );
    }

    // Prepare payment data
    const paymentData: PaymentData = {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      payment_status: payment.status,
      amount: Number(payment.amount) / 100, // Convert paise to rupees
      currency: payment.currency,
      method: payment.method,
      email: payment.email || '',
      contact: payment.contact || '',
      created_at: payment.created_at,
    };

    // Save payment to database if order data is provided
    if (order_data) {
      await savePaymentToDatabase(paymentData, order_data);
    }

    // Log successful payment verification
    console.log(`Payment verified successfully: ${razorpay_payment_id} for amount: ₹${paymentData.amount}`);

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      payment: {
        id: paymentData.razorpay_payment_id,
        order_id: paymentData.razorpay_order_id,
        amount: paymentData.amount,
        currency: paymentData.currency,
        method: paymentData.method,
        status: paymentData.payment_status,
        created_at: paymentData.created_at,
      },
    });

  } catch (error: unknown) {
    console.error('Payment verification failed:', error);

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
    
    return NextResponse.json(
      { 
        error: 'Payment verification failed', 
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        success: false 
      },
      { status: 500 }
    );
  }
}

async function savePaymentToDatabase(paymentData: PaymentData, orderData: { id: string; email: string; amount: number }) {
  try {
    // Update order with payment information
    await prisma.order.update({
      where: {
        id: orderData.id,
      },
      data: {
        paymentId: paymentData.razorpay_payment_id,
        financialStatus: 'paid',
        paymentMethod: 'razorpay',
        paidAt: new Date(paymentData.created_at * 1000), // Convert Unix timestamp to Date
        paymentDetails: {
          razorpay_order_id: paymentData.razorpay_order_id,
          razorpay_signature: paymentData.razorpay_signature,
          method: paymentData.method,
          currency: paymentData.currency,
        },
      },
    });

    console.log(`Order ${orderData.id} updated with payment information`);
  } catch (dbError) {
    console.error('Failed to save payment to database:', dbError);
    throw new Error('Failed to update order with payment information');
  }
}
