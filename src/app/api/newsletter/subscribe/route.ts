import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { emailService } from "@/lib/email";

const subscribeSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  preferences: z.object({
    categories: z.array(z.string()).optional(),
    frequency: z.enum(["daily", "weekly", "monthly"]).optional(),
  }).optional(),
  source: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = subscribeSchema.parse(body);

    // Check if subscriber already exists
    const existingSubscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email: validatedData.email },
    });

    if (existingSubscriber) {
      if (existingSubscriber.isActive) {
        return NextResponse.json(
          { error: "Email is already subscribed to our newsletter" },
          { status: 409 }
        );
      } else {
        // Reactivate existing subscriber
        const updatedSubscriber = await prisma.newsletterSubscriber.update({
          where: { email: validatedData.email },
          data: {
            isActive: true,
            firstName: validatedData.firstName || existingSubscriber.firstName,
            lastName: validatedData.lastName || existingSubscriber.lastName,
            preferences: validatedData.preferences || existingSubscriber.preferences,
            source: validatedData.source || existingSubscriber.source,
            subscribedAt: new Date(),
            unsubscribedAt: null,
            updatedAt: new Date(),
          },
        });

        // Send welcome email
    const unsubscribeUrl = `${process.env.NEXTAUTH_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(updatedSubscriber.email)}`;
    await emailService.sendNewsletterWelcomeEmail({
      email: updatedSubscriber.email,
      firstName: updatedSubscriber.firstName,
      lastName: updatedSubscriber.lastName,
      unsubscribeUrl,
    });

        return NextResponse.json({
          message: "Successfully resubscribed to newsletter",
          subscriber: {
            id: updatedSubscriber.id,
            email: updatedSubscriber.email,
            firstName: updatedSubscriber.firstName,
            lastName: updatedSubscriber.lastName,
          },
        });
      }
    }

    // Create new subscriber
    const newSubscriber = await prisma.newsletterSubscriber.create({
      data: {
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        preferences: validatedData.preferences,
        source: validatedData.source || "website",
        isActive: true,
      },
    });

    // Send welcome email
    const unsubscribeUrl = `${process.env.NEXTAUTH_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(newSubscriber.email)}`;
    await emailService.sendNewsletterWelcomeEmail({
      email: newSubscriber.email,
      firstName: newSubscriber.firstName,
      lastName: newSubscriber.lastName,
      unsubscribeUrl,
    });

    return NextResponse.json({
      message: "Successfully subscribed to newsletter",
      subscriber: {
        id: newSubscriber.id,
        email: newSubscriber.email,
        firstName: newSubscriber.firstName,
        lastName: newSubscriber.lastName,
      },
    });
  } catch (error) {
    console.error("Newsletter subscription error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to subscribe to newsletter" },
      { status: 500 }
    );
  }
}

async function sendWelcomeEmail(email: string, firstName?: string | null) {
  try {
    const name = firstName || "Valued Customer";
    
    await emailService.sendEmail({
      to: email,
      subject: "Welcome to ElanorraLiving Community! 🏡",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin-bottom: 10px;">Welcome to ElanorraLiving!</h1>
            <p style="color: #7f8c8d; font-size: 16px;">Thank you for joining our community of luxury home living enthusiasts</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #2c3e50; margin-bottom: 15px;">Hello ${name}! 👋</h2>
            <p style="color: #34495e; line-height: 1.6; margin-bottom: 15px;">
              We're thrilled to have you as part of the ElanorraLiving community! You'll now receive:
            </p>
            <ul style="color: #34495e; line-height: 1.8; margin-left: 20px;">
              <li>Exclusive offers and early access to sales</li>
              <li>Design inspiration and home styling tips</li>
              <li>Latest trends in luxury home living</li>
              <li>New product announcements</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-bottom: 25px;">
            <a href="${process.env.NEXTAUTH_URL || 'https://elanorra.com'}/shop" 
               style="background: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Start Shopping
            </a>
          </div>
          
          <div style="border-top: 1px solid #ecf0f1; padding-top: 20px; text-align: center;">
            <p style="color: #95a5a6; font-size: 14px; margin-bottom: 10px;">
              You can update your preferences or unsubscribe at any time.
            </p>
            <p style="color: #95a5a6; font-size: 12px;">
              © ${new Date().getFullYear()} ElanorraLiving. All rights reserved.
            </p>
          </div>
        </div>
      `,
      text: `
        Welcome to ElanorraLiving Community!
        
        Hello ${name}!
        
        We're thrilled to have you as part of the ElanorraLiving community! You'll now receive:
        
        • Exclusive offers and early access to sales
        • Design inspiration and home styling tips  
        • Latest trends in luxury home living
        • New product announcements
        
        Start shopping: ${process.env.NEXTAUTH_URL || 'https://elanorra.com'}/shop
        
        You can update your preferences or unsubscribe at any time.
        
        © ${new Date().getFullYear()} ElanorraLiving. All rights reserved.
      `,
    });
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    // Don't throw error - subscription should still succeed even if email fails
  }
}