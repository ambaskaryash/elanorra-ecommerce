import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { Buffer } from 'buffer';
// pdfkit does not ship TypeScript types by default in many setups
// Use CommonJS require and annotate as any to avoid type resolution errors
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument: any = require('pdfkit');

// Helper to render a simple invoice PDF into a Buffer
async function renderInvoicePDF(order: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });
      doc.on('error', (err: Error) => reject(err));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc
        .font('Helvetica-Bold')
        .fontSize(18)
        .text('Invoice', { align: 'left' })
        .moveDown(0.5);

      doc
        .font('Helvetica')
        .fontSize(11)
        .text(`Invoice Number: ${order.invoiceNumber || `INV-${order.orderNumber}`}`)
        .text(`Order Number: ${order.orderNumber}`)
        .text(`Order Date: ${new Date(order.createdAt as Date).toLocaleDateString()}`)
        .text(`Payment Status: ${order.financialStatus || 'paid'}`)
        .text(`Payment Method: ${order.paymentMethod || 'razorpay'}`)
        .moveDown(1);

      // Billing & Shipping
      doc.font('Helvetica-Bold').text('Billing Address');
      doc.font('Helvetica')
        .text(order.billingAddress ? `${order.billingAddress.firstName} ${order.billingAddress.lastName}` : '')
        .text(order.billingAddress ? `${order.billingAddress.address1}` : '')
        .text(order.billingAddress ? `${order.billingAddress.city}, ${order.billingAddress.state} ${order.billingAddress.zipCode}` : '')
        .text(order.billingAddress ? `${order.billingAddress.country}` : '')
        .moveDown(0.75);

      doc.font('Helvetica-Bold').text('Shipping Address');
      doc.font('Helvetica')
        .text(order.shippingAddress ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}` : '')
        .text(order.shippingAddress ? `${order.shippingAddress.address1}` : '')
        .text(order.shippingAddress ? `${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}` : '')
        .text(order.shippingAddress ? `${order.shippingAddress.country}` : '')
        .moveDown(1);

      // Items table header
      doc.font('Helvetica-Bold').text('Items').moveDown(0.5);
      doc.font('Helvetica');

      // Items
      const currency = order.currency || 'INR';
      order.items.forEach((item: any) => {
        const name = item.product?.name || 'Product';
        const quantity = item.quantity;
        const price = item.price;
        const lineTotal = (Number(price) || 0) * (Number(quantity) || 0);
        doc.text(`${name}  x${quantity}  —  ${currency} ${lineTotal.toFixed(2)}`);
      });

      doc.moveDown(1);

      // Totals
      const subtotal = Number(order.subtotal || 0);
      const taxes = Number(order.taxes || 0);
      const shipping = Number(order.shipping || 0);
      const discount = Number(order.discount || 0);
      const total = Number(order.totalPrice || 0);

      doc
        .font('Helvetica-Bold')
        .text('Summary')
        .font('Helvetica')
        .text(`Subtotal: ${currency} ${subtotal.toFixed(2)}`)
        .text(`Taxes: ${currency} ${taxes.toFixed(2)}`)
        .text(`Shipping: ${currency} ${shipping.toFixed(2)}`)
        .text(`Discount: ${currency} ${discount.toFixed(2)}`)
        .moveDown(0.5)
        .font('Helvetica-Bold')
        .text(`Total: ${currency} ${total.toFixed(2)}`)
        .moveDown(1);

      doc.font('Helvetica').fontSize(10).text('Thank you for your purchase!', { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderId = context.params.id;
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: { select: { name: true } }
          }
        },
        shippingAddress: true,
        billingAddress: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Ensure invoice metadata exists; otherwise, generate minimal invoice metadata
    const invoiceNumber = order.invoiceNumber || `INV-${order.orderNumber}`;

    // Render PDF on the fly
    const pdfBuffer = await renderInvoicePDF(order);

    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `attachment; filename=invoice-${invoiceNumber}.pdf`);

    // Convert Node Buffer to ArrayBuffer for web Response compatibility
    const pdfArrayBuffer = pdfBuffer.buffer.slice(
      pdfBuffer.byteOffset,
      pdfBuffer.byteOffset + pdfBuffer.byteLength
    );

    return new NextResponse(pdfArrayBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Invoice download error:', error);
    return NextResponse.json(
      { error: 'Failed to download invoice' },
      { status: 500 }
    );
  }
}