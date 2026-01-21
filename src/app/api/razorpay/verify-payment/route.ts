import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';

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
    // Require authentication before verifying payments
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required', success: false },
        { status: 401 }
      );
    }

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

    // Save payment to database if order data is provided and DB is available
    if (order_data) {
      if (!process.env.DATABASE_URL) {
        console.warn('⚠️ DATABASE_URL not available, skipping DB update for payment verification');
      } else {
        await savePaymentToDatabase(paymentData, order_data);
      }
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

import { emailService } from '@/lib/email';

async function savePaymentToDatabase(paymentData: PaymentData, orderData: { id: string; email: string; amount: number }) {
  try {
    // Update order with payment information and fetch details for email
    const updatedOrder = await prisma.order.update({
      where: {
        id: orderData.id,
      },
      data: {
        paymentId: paymentData.razorpay_payment_id,
        financialStatus: 'paid',
        paymentMethod: 'razorpay',
        // updatedAt will auto-update via Prisma @updatedAt
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                images: {
                  take: 1,
                  orderBy: { position: 'asc' }
                }
              }
            }
          }
        },
        shippingAddress: true,
      }
    });

    console.log(`Order ${orderData.id} updated with payment information`);

    // Send confirmation email
    try {
      if (updatedOrder.shippingAddress) {
        await emailService.sendOrderConfirmationEmail({
          email: updatedOrder.email,
          orderNumber: updatedOrder.orderNumber,
          orderId: updatedOrder.id,
          customerName: `${updatedOrder.shippingAddress.firstName} ${updatedOrder.shippingAddress.lastName}`,
          totalPrice: updatedOrder.totalPrice,
          subtotal: updatedOrder.subtotal,
          taxes: updatedOrder.taxes,
          shipping: updatedOrder.shipping,
          discount: updatedOrder.discount,
          currency: updatedOrder.currency,
          paymentMethod: 'Razorpay',
          createdAt: updatedOrder.createdAt.toISOString(),
          items: updatedOrder.items.map((item: any) => ({
            name: item.product?.name || 'Product',
            quantity: item.quantity,
            price: item.price,
            image: item.product?.images?.[0]?.src || '',
            variants: item.variants as Record<string, unknown> || {}
          })),
          shippingAddress: {
            firstName: updatedOrder.shippingAddress.firstName,
            lastName: updatedOrder.shippingAddress.lastName,
            company: updatedOrder.shippingAddress.company || undefined,
            address1: updatedOrder.shippingAddress.address1,
            address2: updatedOrder.shippingAddress.address2 || undefined,
            city: updatedOrder.shippingAddress.city,
            state: updatedOrder.shippingAddress.state,
            zipCode: updatedOrder.shippingAddress.zipCode,
            country: updatedOrder.shippingAddress.country,
            phone: updatedOrder.shippingAddress.phone || undefined
          }
        });
        console.log(`Confirmation email sent for order ${orderData.id}`);
      } else {
        console.warn(`Skipping email for order ${orderData.id}: No shipping address found`);
      }
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Continue without failing the request
    }

  } catch (dbError) {
    console.error('Failed to save payment to database:', dbError);
    throw new Error('Failed to update order with payment information');
  }
}
