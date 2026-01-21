import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { logger } from '@/lib/logger';
import { pushOrderToOdoo } from '@/lib/odoo/push';

// Razorpay webhook secret from environment variables
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    if (!WEBHOOK_SECRET) {
      logger.error('RAZORPAY_WEBHOOK_SECRET is not defined');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature header' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      logger.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const payload = JSON.parse(body);
    const event = payload.event;

    logger.info(`Received Razorpay webhook event: ${event}`);

    // Handle specific events
    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(payload.payload.payment.entity);
        break;
      case 'payment.failed':
        await handlePaymentFailed(payload.payload.payment.entity);
        break;
      default:
        logger.info(`Unhandled event type: ${event}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentCaptured(payment: any) {
  const paymentId = payment.id;
  const razorpayOrderId = payment.order_id;
  
  logger.info(`Processing payment capture: ${paymentId} for order ${razorpayOrderId}`);

  try {
    // Try to find the order by paymentId
    const order = await prisma.order.findFirst({
      where: {
        paymentId: paymentId,
      },
    });

    if (order) {
      if (order.financialStatus !== 'paid') {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            financialStatus: 'paid',
            // Update other fields if necessary
          },
        });
        logger.info(`Order ${order.id} marked as paid via webhook`);
        
        // Trigger Odoo Sync (Non-blocking)
        // We call it without await so the webhook returns quickly
        pushOrderToOdoo(order.id).catch(err => 
          logger.error('Background Odoo push failed', err)
        );
        
      } else {
        logger.info(`Order ${order.id} is already paid`);
      }
    } else {
      logger.warn(`Order not found for payment ID: ${paymentId}. This might be because the client-side flow failed to update the order with the payment ID.`);
    }
  } catch (error) {
    logger.error('Error handling payment capture:', error);
  }
}

async function handlePaymentFailed(payment: any) {
  const paymentId = payment.id;
  const razorpayOrderId = payment.order_id;
  
  logger.info(`Processing payment failure: ${paymentId} for order ${razorpayOrderId}`);

  try {
    const order = await prisma.order.findFirst({
      where: {
        paymentId: paymentId,
      },
    });

    if (order) {
      if (order.financialStatus !== 'failed') {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            financialStatus: 'failed',
          },
        });
        logger.info(`Order ${order.id} marked as failed via webhook`);
      }
    } else {
      logger.warn(`Order not found for failed payment ID: ${paymentId}`);
    }
  } catch (error) {
    logger.error('Error handling payment failure:', error);
  }
}
