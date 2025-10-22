import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

// GET - List all subscribers (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const statsOnly = searchParams.get('stats') === 'true';

    // If requesting stats only
    if (statsOnly) {
      const [totalSubscribers, activeSubscribers, totalNewsletters, newsletters] = await Promise.all([
        prisma.newsletterSubscriber.count(),
        prisma.newsletterSubscriber.count({ where: { isActive: true } }),
        prisma.newsletter.count(),
        prisma.newsletter.findMany({
          where: { status: 'sent' },
          select: { sentCount: true, openCount: true },
        }),
      ]);

      // Calculate average open rate
      const totalSent = newsletters.reduce((sum, n) => sum + n.sentCount, 0);
      const totalOpens = newsletters.reduce((sum, n) => sum + n.openCount, 0);
      const averageOpenRate = totalSent > 0 ? (totalOpens / totalSent) * 100 : 0;

      return NextResponse.json({
        stats: {
          totalSubscribers,
          activeSubscribers,
          totalNewsletters,
          averageOpenRate,
        },
      });
    }

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status"); // 'active', 'inactive', or null for all
    const search = searchParams.get("search") || ''; // search by email or name

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }
    
    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    // Get subscribers with pagination
    const [subscribers, total] = await Promise.all([
      prisma.newsletterSubscriber.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.newsletterSubscriber.count({ where }),
    ]);

    return NextResponse.json({
      subscribers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching subscribers:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscribers" },
      { status: 500 }
    );
  }
}

// DELETE - Remove subscriber (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const id = searchParams.get("id");

    if (!email && !id) {
      return NextResponse.json(
        { error: "Either email or id parameter is required" },
        { status: 400 }
      );
    }

    const where = email ? { email } : { id };

    const deletedSubscriber = await prisma.newsletterSubscriber.delete({
      where,
    });

    return NextResponse.json({
      message: "Subscriber deleted successfully",
      subscriber: {
        id: deletedSubscriber.id,
        email: deletedSubscriber.email,
      },
    });
  } catch (error: any) {
    console.error("Error deleting subscriber:", error);
    
    if (error?.code === "P2025") {
      return NextResponse.json(
        { error: "Subscriber not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete subscriber" },
      { status: 500 }
    );
  }
}

// PATCH - Update subscriber status (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const updateSchema = z.object({
      id: z.string().optional(),
      email: z.string().email().optional(),
      isActive: z.boolean().optional(),
      preferences: z.object({
        categories: z.array(z.string()).optional(),
        frequency: z.enum(["daily", "weekly", "monthly"]).optional(),
      }).optional(),
    });

    const body = await request.json();
    const data = updateSchema.parse(body);

    if (!data.id && !data.email) {
      return NextResponse.json(
        { error: "Either id or email is required" },
        { status: 400 }
      );
    }

    const where = data.id ? { id: data.id } : { email: data.email };
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
      if (data.isActive) {
        updateData.subscribedAt = new Date();
        updateData.unsubscribedAt = null;
      } else {
        updateData.unsubscribedAt = new Date();
      }
    }

    if (data.preferences) {
      updateData.preferences = data.preferences;
    }

    const updatedSubscriber = await prisma.newsletterSubscriber.update({
      where,
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        preferences: true,
        source: true,
        subscribedAt: true,
        unsubscribedAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "Subscriber updated successfully",
      subscriber: updatedSubscriber,
    });
  } catch (error: any) {
    console.error("Error updating subscriber:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 }
      );
    }

    if (error?.code === "P2025") {
      return NextResponse.json(
        { error: "Subscriber not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update subscriber" },
      { status: 500 }
    );
  }
}