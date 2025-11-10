import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

// Validation schemas
const createTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  category: z.string().default("general"),
  subject: z.string().optional(),
  htmlContent: z.string().min(1, "HTML content is required"),
  textContent: z.string().optional(),
  variables: z.record(z.any()).optional(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  thumbnail: z.string().optional(),
});

const updateTemplateSchema = createTemplateSchema.partial();

// GET - Fetch all email templates
export async function GET(request: NextRequest) {
  try {
    // Temporarily bypass authentication for development
    // TODO: Implement proper authentication once Clerk is fully configured
    const { userId } = await auth();
    
    // Allow access for development purposes
    let isAuthorized = true;
    
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      
      if (!user) {
        // For development, we'll allow access even if user is not found
        console.log('User not found in database, allowing access for development');
      }
    } else {
      // For development, we'll allow access even without session
      console.log('No session found, allowing access for development');
    }

    console.log('GET /api/newsletter/templates - Starting request');

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const isActive = searchParams.get("isActive");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    console.log('Query parameters:', { category, isActive, page, limit, skip });

    // Build where clause
    const where: any = {};
    if (category) where.category = category;
    if (isActive !== null) where.isActive = isActive === "true";

    console.log('Where clause:', where);

    // Fetch templates with pagination
    const [templates, total] = await Promise.all([
      prisma.emailTemplate.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.emailTemplate.count({ where }),
    ]);

    console.log('Query results:', { templatesCount: templates.length, total });

    return NextResponse.json({
      templates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching email templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch email templates" },
      { status: 500 }
    );
  }
}

// POST - Create new email template
export async function POST(request: NextRequest) {
  try {
    // Dev-friendly auth: allow POST in non-production even without a Clerk user
    let isAuthorized = true;
    try {
      const { userId } = await auth();
      // TODO: Add admin role check for Clerk users
      if (process.env.NODE_ENV === "production" && !userId) {
        isAuthorized = false;
      }
    } catch (e) {
      // In development, proceed even if auth provider is not fully configured
      if (process.env.NODE_ENV === "production") {
        throw e;
      }
    }
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createTemplateSchema.parse(body);

    // If setting as default, unset other defaults in the same category
    if (validatedData.isDefault) {
      await prisma.emailTemplate.updateMany({
        where: {
          category: validatedData.category,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    const template = await prisma.emailTemplate.create({
      data: validatedData,
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating email template:", error);
    return NextResponse.json(
      { error: "Failed to create email template" },
      { status: 500 }
    );
  }
}

// PUT - Update email template
export async function PUT(request: NextRequest) {
  try {
    // Dev-friendly auth: allow PUT in non-production even without a Clerk user
    let isAuthorized = true;
    try {
      const { userId } = await auth();
      // TODO: Add admin role check for Clerk users
      if (process.env.NODE_ENV === "production" && !userId) {
        isAuthorized = false;
      }
    } catch (e) {
      // In development, proceed even if auth provider is not fully configured
      if (process.env.NODE_ENV === "production") {
        throw e;
      }
    }
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateTemplateSchema.parse(body);

    // Check if template exists
    const existingTemplate = await prisma.emailTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // If setting as default, unset other defaults in the same category
    if (validatedData.isDefault) {
      const category = validatedData.category || existingTemplate.category;
      await prisma.emailTemplate.updateMany({
        where: {
          category,
          isDefault: true,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json({ template });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating email template:", error);
    return NextResponse.json(
      { error: "Failed to update email template" },
      { status: 500 }
    );
  }
}

// DELETE - Delete email template
export async function DELETE(request: NextRequest) {
  try {
    // Dev-friendly auth: allow DELETE in non-production even without a Clerk user
    let isAuthorized = true;
    try {
      const { userId } = await auth();
      // TODO: Add admin role check for Clerk users
      if (process.env.NODE_ENV === "production" && !userId) {
        isAuthorized = false;
      }
    } catch (e) {
      // In development, proceed even if auth provider is not fully configured
      if (process.env.NODE_ENV === "production") {
        throw e;
      }
    }
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    // Check if template exists
    const existingTemplate = await prisma.emailTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    await prisma.emailTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error("Error deleting email template:", error);
    return NextResponse.json(
      { error: "Failed to delete email template" },
      { status: 500 }
    );
  }
}