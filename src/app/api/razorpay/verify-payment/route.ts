import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';

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
      amount: payment.amount / 100, // Convert paise to rupees
      currency: payment.currency,
      method: payment.method,
      email: payment.email,
      contact: payment.contact,
      created_at: payment.created_at,
    };

    // TODO: Save payment data to your database here
    // await savePaymentToDatabase(paymentData, order_data);

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      payment: paymentData,
    });

  } catch (error: any) {
    console.error('Payment verification failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Payment verification failed', 
        message: error.message,
        success: false 
      },
      { status: 500 }
    );
  }
}

// Helper function to save payment data (implement according to your database schema)
async function savePaymentToDatabase(paymentData: any, orderData: any) {
  // Implementation depends on your database setup
  // Example with Prisma:
  /*
  await prisma.payment.create({
    data: {
      razorpayPaymentId: paymentData.razorpay_payment_id,
      razorpayOrderId: paymentData.razorpay_order_id,
      razorpaySignature: paymentData.razorpay_signature,
      status: paymentData.payment_status,
      amount: paymentData.amount,
      currency: paymentData.currency,
      method: paymentData.method,
      // ... other fields
    }
  });
  */
}