import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { InvoiceService } from '@/lib/services/invoice-service';
import { sendInvoiceEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Fetch order with all related data
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
                variants: true,
              },
            },
          },
        },
        shippingAddress: true,
        billingAddress: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if invoice already exists
    if (order.invoiceGenerated && order.invoiceFilePath) {
      return NextResponse.json({
        message: 'Invoice already exists',
        invoiceNumber: order.invoiceNumber,
        filePath: order.invoiceFilePath,
      });
    }

    // Generate invoice data
    const invoiceData = InvoiceService.generateInvoiceData(order);
    
    // Generate invoice number
    const invoiceNumber = `INV-${order.orderNumber}-${Date.now()}`;
    
    // Generate invoice filename and file path
    const invoiceFilename = InvoiceService.generateInvoiceFilename(order.orderNumber);
    
    // For now, we'll create a placeholder file path since we need a browser environment for PDF generation
    // In a real implementation, you'd use Puppeteer or similar server-side PDF generation
    const invoiceFilePath = `/invoices/${invoiceFilename}`;

    // Update order with invoice information
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        invoiceNumber,
        invoiceGenerated: true,
        invoiceFilePath: invoiceFilePath,
      },
    });

    // Send invoice email to customer
    try {
      const customerName = order.shippingAddress 
        ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`
        : undefined;

      await sendInvoiceEmail({
        email: order.email,
        customerName,
        orderNumber: order.orderNumber,
        invoiceNumber: invoiceNumber,
        totalAmount: order.totalPrice,
        currency: order.currency,
        invoiceFilePath: invoiceFilePath,
        createdAt: order.createdAt.toISOString(),
      });

      // Send copy to info@elanorraliving.in
      await sendInvoiceEmail({
        email: 'info@elanorraliving.in',
        customerName: `Copy for ${customerName || 'Customer'}`,
        orderNumber: order.orderNumber,
        invoiceNumber: invoiceNumber,
        totalAmount: order.totalPrice,
        currency: order.currency,
        invoiceFilePath: invoiceFilePath,
        createdAt: order.createdAt.toISOString(),
      });

      // Update email sent status
      await prisma.order.update({
        where: { id: orderId },
        data: { invoiceEmailSent: true },
      });

    } catch (emailError) {
      console.error('Failed to send invoice email:', emailError);
      // Don't fail the entire process if email fails
    }

    return NextResponse.json({
      message: 'Invoice generated successfully',
      invoiceNumber: invoiceNumber,
      filePath: invoiceFilePath,
      emailSent: updatedOrder.invoiceEmailSent,
    });

  } catch (error) {
    console.error('Invoice generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}