import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

// Validation schema for template updates
const updateTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  subject: z.string().optional(),
  htmlContent: z.string().min(1, "HTML content is required").optional(),
  textContent: z.string().optional(),
  variables: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  thumbnail: z.string().optional(),
});

// GET - Fetch specific email template
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Dev-friendly auth: allow access in non-production even without a Clerk user
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

    const { id } = params;

    const template = await prisma.emailTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Error fetching email template:", error);
    return NextResponse.json(
      { error: "Failed to fetch email template" },
      { status: 500 }
    );
  }
}

// PUT - Update specific email template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Dev-friendly auth: allow updates in non-production even without a Clerk user
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

    const { id } = params;
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

// DELETE - Delete specific email template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Dev-friendly auth: allow deletes in non-production even without a Clerk user
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

    const { id } = params;

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

// PATCH - Duplicate email template
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Dev-friendly auth: allow actions in non-production even without a Clerk user
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

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "duplicate") {
      // Find the original template
      const originalTemplate = await prisma.emailTemplate.findUnique({
        where: { id },
      });

      if (!originalTemplate) {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 }
        );
      }

      // Create a duplicate
      const duplicateTemplate = await prisma.emailTemplate.create({
        data: {
          name: `${originalTemplate.name} (Copy)`,
          description: originalTemplate.description,
          category: originalTemplate.category,
          subject: originalTemplate.subject,
          htmlContent: originalTemplate.htmlContent,
          textContent: originalTemplate.textContent,
          variables: originalTemplate.variables,
          isActive: false, // Set as inactive by default
          isDefault: false, // Never duplicate as default
          thumbnail: originalTemplate.thumbnail,
        },
      });

      return NextResponse.json({ template: duplicateTemplate });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error processing template action:", error);
    return NextResponse.json(
      { error: "Failed to process template action" },
      { status: 500 }
    );
  }
}