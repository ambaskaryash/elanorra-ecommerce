import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

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
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      order_data,
    } = await request.json();

    // Validate required fields
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing required payment verification parameters' },
        { status: 400 }
      );
    }

    // Create signature for verification
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return NextResponse.json(
        { 
          error: 'Payment verification failed - Invalid signature',
          success: false 
        },
        { status: 400 }
      );
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    
    // Here you can save the payment details to your database
    // and update the order status
    
    const paymentData = {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      payment_status: payment.status,
      amount: Number(payment.amount) / 100, // Convert paise to rupees
      currency: payment.currency,
      method: payment.method,
      email: payment.email,
      contact: payment.contact,
      created_at: payment.created_at,
    };

    await savePaymentToDatabase(paymentData, order_data);

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      payment: paymentData,
    });

  } catch (error: unknown) {
    console.error('Payment verification failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Payment verification failed', 
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        success: false 
      },
      { status: 500 }
    );
  }
}

async function savePaymentToDatabase(paymentData: PaymentData, orderData: { id: string }) {
  await prisma.order.update({
    where: {
      id: orderData.id,
    },
    data: {
      paymentId: paymentData.razorpay_payment_id,
      financialStatus: 'paid',
      paymentMethod: 'razorpay',
    },
  });
}
