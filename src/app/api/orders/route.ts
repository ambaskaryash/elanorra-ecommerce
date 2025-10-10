import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

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
    variants: z.record(z.any()).optional(),
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

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: validatedData.userId || null,
        email: validatedData.email,
        subtotal: validatedData.subtotal,
        taxes: validatedData.taxes || 0,
        shipping: validatedData.shipping || 0,
        discount: validatedData.discount || 0,
        totalPrice: validatedData.totalPrice,
        paymentMethod: validatedData.paymentMethod,
        paymentId: validatedData.paymentId,
        couponCode: validatedData.couponCode,
        notes: validatedData.notes,
        shippingAddressId: shippingAddress.id,
        billingAddressId: billingAddress.id,
        items: {
          create: validatedData.items.map(item => ({
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

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}