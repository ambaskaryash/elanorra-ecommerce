import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { Product, ProductVariant } from '@prisma/client';

// GET /api/orders - Get all orders with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (userId) {
      where.userId = userId;
    }
    
    if (status) {
      where.financialStatus = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: {
                    take: 1,
                    orderBy: { position: 'asc' }
                  }
                }
              }
            }
          },
          shippingAddress: true,
          billingAddress: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create a new order
const createOrderSchema = z.object({
  userId: z.string().optional(),
  email: z.string().email(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
    price: z.number().positive(),
    variants: z.record(z.string(), z.any()).optional(),
  })),
  shippingAddress: z.object({
    firstName: z.string(),
    lastName: z.string(),
    company: z.string().optional(),
    address1: z.string(),
    address2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string().default('India'),
    phone: z.string().optional(),
  }),
  billingAddress: z.object({
    firstName: z.string(),
    lastName: z.string(),
    company: z.string().optional(),
    address1: z.string(),
    address2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string().default('India'),
    phone: z.string().optional(),
  }).optional(),
  // Optional shipment tracking fields
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
  shippedAt: z.string().optional(),
  estimatedDelivery: z.string().optional(),
  subtotal: z.number().positive(),
  taxes: z.number().min(0).optional(),
  shipping: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  totalPrice: z.number().positive(),
  paymentMethod: z.string().optional(),
  paymentId: z.string().optional(),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createOrderSchema.parse(body);

    // Fetch product data to compute server-side pricing and validate inventory
    const productIds = validatedData.items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { variants: true },
    });
    const productMap = new Map<string, Product & { variants: ProductVariant[] }>(
      products.map((p: Product & { variants: ProductVariant[] }) => [p.id, p])
    );

    // Compute item prices and subtotal securely
    let subtotal = 0;
    const calculatedItems = [] as {
      productId: string;
      quantity: number;
      price: number; // unit price
      variants?: Record<string, any>;
    }[];

    for (const item of validatedData.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 404 }
        );
      }

      // Inventory check
      if (product.inventory !== null && product.inventory < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient inventory for product: ${product.name}` },
          { status: 400 }
        );
      }
      if (product.inStock === false) {
        return NextResponse.json(
          { error: `Product is out of stock: ${product.name}` },
          { status: 400 }
        );
      }

      // Compute unit price: base + matching variant adjustments
      let unitPrice = Number(product.price);
      if (item.variants) {
        for (const [variantName, variantValue] of Object.entries(item.variants)) {
          const match = product.variants.find(v => v.name === variantName && v.value === String(variantValue));
          if (match && typeof match.priceAdjustment === 'number') {
            unitPrice += match.priceAdjustment;
          }
        }
      }

      subtotal += unitPrice * item.quantity;
      calculatedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: unitPrice,
        variants: item.variants,
      });
    }

    // Apply coupon if provided
    let discount = 0;
    let appliedCouponId: string | null = null;
    if (validatedData.couponCode) {
      const now = new Date();
      const coupon = await prisma.coupon.findFirst({
        where: {
          code: validatedData.couponCode,
          isActive: true,
          validFrom: { lte: now },
          validTo: { gte: now },
        },
      });

      if (!coupon) {
        return NextResponse.json(
          { error: 'Invalid or expired coupon code' },
          { status: 400 }
        );
      }

      if (coupon.minAmount && subtotal < coupon.minAmount) {
        return NextResponse.json(
          { error: `Order does not meet minimum amount for coupon` },
          { status: 400 }
        );
      }

      if (coupon.usageLimit && coupon.usageCount && coupon.usageCount >= coupon.usageLimit) {
        return NextResponse.json(
          { error: 'Coupon usage limit reached' },
          { status: 400 }
        );
      }

      if (coupon.type === 'PERCENTAGE') {
        discount = (coupon.value / 100) * subtotal;
        if (coupon.maxDiscount) {
          discount = Math.min(discount, coupon.maxDiscount);
        }
      } else {
        // FIXED amount
        discount = coupon.value;
        if (coupon.maxDiscount) {
          discount = Math.min(discount, coupon.maxDiscount);
        }
      }
      appliedCouponId = coupon.id;
    }

    const taxes = Math.max(0, validatedData.taxes || 0);
    const shipping = Math.max(0, validatedData.shipping || 0);
    const totalPrice = Math.max(0, subtotal + taxes + shipping - discount);

    // Generate order number
    const orderCount = await prisma.order.count();
    const orderNumber = `ORD-${Date.now()}-${(orderCount + 1).toString().padStart(4, '0')}`;

    // Create addresses first
    const shippingAddress = await prisma.address.create({
      data: {
        ...validatedData.shippingAddress,
        userId: validatedData.userId || null,
      },
    });

    let billingAddress = shippingAddress;
    if (validatedData.billingAddress) {
      billingAddress = await prisma.address.create({
        data: {
          ...validatedData.billingAddress,
          userId: validatedData.userId || null,
        },
      });
    }

    // Create order with server-computed totals and item prices
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: validatedData.userId || null,
        email: validatedData.email,
        trackingNumber: validatedData.trackingNumber || null,
        carrier: validatedData.carrier || null,
        shippedAt: validatedData.shippedAt ? new Date(validatedData.shippedAt) : null,
        estimatedDelivery: validatedData.estimatedDelivery ? new Date(validatedData.estimatedDelivery) : null,
        subtotal,
        taxes,
        shipping,
        discount,
        totalPrice,
        paymentMethod: validatedData.paymentMethod,
        paymentId: validatedData.paymentId,
        couponCode: validatedData.couponCode,
        notes: validatedData.notes,
        shippingAddressId: shippingAddress.id,
        billingAddressId: billingAddress.id,
        items: {
          create: calculatedItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            variants: item.variants,
          }))
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                slug: true,
                images: { take: 1 }
              }
            }
          }
        },
        shippingAddress: true,
        billingAddress: true,
      },
    });

    // Decrement inventory for purchased products
    for (const item of calculatedItems) {
      const product = productMap.get(item.productId)!;
      const newInventory = (product.inventory || 0) - item.quantity;
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          inventory: Math.max(0, newInventory),
          inStock: newInventory > 0,
        },
      });
    }

    // Increment coupon usage if applied
    if (appliedCouponId) {
      await prisma.coupon.update({
        where: { id: appliedCouponId },
        data: { usageCount: { increment: 1 } },
      });
    }

    // Generate invoice asynchronously (don't wait for it to complete)
    try {
      const invoiceResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/invoices/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId: order.id }),
      });
      
      if (!invoiceResponse.ok) {
        console.error('Failed to generate invoice:', await invoiceResponse.text());
      }
    } catch (invoiceError) {
      console.error('Error triggering invoice generation:', invoiceError);
      // Don't fail the order creation if invoice generation fails
    }

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

// PATCH /api/orders - Update order tracking fields
const updateTrackingSchema = z.object({
  orderId: z.string(),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
  shippedAt: z.string().optional(),
  estimatedDelivery: z.string().optional(),
  fulfillmentStatus: z.string().optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const data = updateTrackingSchema.parse(body);

    const updated = await prisma.order.update({
      where: { id: data.orderId },
      data: {
        trackingNumber: data.trackingNumber ?? undefined,
        carrier: data.carrier ?? undefined,
        shippedAt: data.shippedAt ? new Date(data.shippedAt) : undefined,
        estimatedDelivery: data.estimatedDelivery ? new Date(data.estimatedDelivery) : undefined,
        fulfillmentStatus: data.fulfillmentStatus ?? undefined,
      },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, slug: true, images: { take: 1 } }
            }
          }
        },
        shippingAddress: true,
        billingAddress: true,
      }
    });

    return NextResponse.json({ order: updated });
  } catch (error) {
    console.error('Error updating order tracking:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}