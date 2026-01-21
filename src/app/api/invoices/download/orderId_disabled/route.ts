import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;

    // Fetch the order with invoice information
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        invoiceNumber: true,
        invoiceGenerated: true,
        invoiceFilePath: true,
        userId: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (!order.invoiceGenerated || !order.invoiceFilePath) {
      return NextResponse.json(
        { error: 'Invoice not available for this order' },
        { status: 404 }
      );
    }

    // TODO: Add user authentication check here
    // Verify that the requesting user owns this order or is an admin

    try {
      // Read the invoice file
      const invoiceBuffer = await readFile(order.invoiceFilePath);

      // Return the PDF file
      return new NextResponse(invoiceBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="invoice-${order.invoiceNumber || order.orderNumber}.pdf"`,
          'Cache-Control': 'private, no-cache',
        },
      });
    } catch (fileError) {
      console.error('Error reading invoice file:', fileError);
      return NextResponse.json(
        { error: 'Invoice file not found or corrupted' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error downloading invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}