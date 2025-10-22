import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const unsubscribeSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = unsubscribeSchema.parse(body);

    // Find the subscriber
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (!subscriber) {
      return NextResponse.json(
        { error: "Email not found in our newsletter list" },
        { status: 404 }
      );
    }

    if (!subscriber.isActive) {
      return NextResponse.json(
        { message: "Email is already unsubscribed" },
        { status: 200 }
      );
    }

    // Unsubscribe the user
    await prisma.newsletterSubscriber.update({
      where: { email },
      data: {
        isActive: false,
        unsubscribedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Successfully unsubscribed from newsletter",
    });
  } catch (error) {
    console.error("Newsletter unsubscribe error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid email address", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to unsubscribe from newsletter" },
      { status: 500 }
    );
  }
}

// GET endpoint for unsubscribe links in emails
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailSchema = z.string().email();
    const validatedEmail = emailSchema.parse(email);

    // Find the subscriber
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email: validatedEmail },
    });

    if (!subscriber) {
      return NextResponse.json(
        { error: "Email not found in our newsletter list" },
        { status: 404 }
      );
    }

    if (!subscriber.isActive) {
      return NextResponse.json(
        { message: "Email is already unsubscribed" },
        { status: 200 }
      );
    }

    // Unsubscribe the user
    await prisma.newsletterSubscriber.update({
      where: { email: validatedEmail },
      data: {
        isActive: false,
        unsubscribedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Return HTML response for direct link clicks
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Unsubscribed - ElanorraLiving</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              max-width: 600px; 
              margin: 50px auto; 
              padding: 20px; 
              text-align: center;
              background-color: #f8f9fa;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 { color: #2c3e50; margin-bottom: 20px; }
            p { color: #34495e; line-height: 1.6; margin-bottom: 15px; }
            .success { color: #27ae60; font-weight: bold; }
            .btn {
              display: inline-block;
              background: #e74c3c;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Successfully Unsubscribed</h1>
            <p class="success">✓ You have been unsubscribed from our newsletter</p>
            <p>We're sorry to see you go! You will no longer receive marketing emails from ElanorraLiving.</p>
            <p>If you change your mind, you can always resubscribe on our website.</p>
            <a href="${process.env.NEXTAUTH_URL}" class="btn">
              Return to ElanorraLiving
            </a>
          </div>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: {
          "Content-Type": "text/html",
        },
      }
    );
  } catch (error) {
    console.error("Newsletter unsubscribe error:", error);

    if (error instanceof z.ZodError) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Error - ElanorraLiving</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { 
                font-family: Arial, sans-serif; 
                max-width: 600px; 
                margin: 50px auto; 
                padding: 20px; 
                text-align: center;
                background-color: #f8f9fa;
              }
              .container {
                background: white;
                padding: 40px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              h1 { color: #e74c3c; margin-bottom: 20px; }
              p { color: #34495e; line-height: 1.6; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Invalid Email Address</h1>
              <p>The email address provided is not valid.</p>
            </div>
          </body>
        </html>
        `,
        {
          status: 400,
          headers: {
            "Content-Type": "text/html",
          },
        }
      );
    }

    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error - ElanorraLiving</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              max-width: 600px; 
              margin: 50px auto; 
              padding: 20px; 
              text-align: center;
              background-color: #f8f9fa;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 { color: #e74c3c; margin-bottom: 20px; }
            p { color: #34495e; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Something went wrong</h1>
            <p>We encountered an error while processing your unsubscribe request. Please try again later.</p>
          </div>
        </body>
      </html>
      `,
      {
        status: 500,
        headers: {
          "Content-Type": "text/html",
        },
      }
    );
  }
}