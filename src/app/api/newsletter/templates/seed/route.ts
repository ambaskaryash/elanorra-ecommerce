import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Default email templates
const defaultTemplates = [
  {
    name: "Blank Template",
    description: "Start with a blank canvas",
    category: "general",
    subject: "",
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{SUBJECT}}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
        <h1 style="color: #333333;">{{TITLE}}</h1>
        <p style="color: #666666; line-height: 1.6;">{{CONTENT}}</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee; text-align: center;">
            <p style="color: #999999; font-size: 12px;">
                <a href="{{UNSUBSCRIBE_URL}}" style="color: #dc2626;">Unsubscribe</a>
            </p>
        </div>
    </div>
</body>
</html>`,
    textContent: `{{TITLE}}

{{CONTENT}}

---
Unsubscribe: {{UNSUBSCRIBE_URL}}`,
    variables: {
      SUBJECT: "Email Subject",
      TITLE: "Email Title",
      CONTENT: "Email content goes here",
      UNSUBSCRIBE_URL: "Unsubscribe link"
    },
    isActive: true,
    isDefault: true,
  },
  {
    name: "Newsletter Template",
    description: "Professional newsletter layout",
    category: "newsletter",
    subject: "{{NEWSLETTER_TITLE}} - {{DATE}}",
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{NEWSLETTER_TITLE}}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);">
    <div style="max-width: 650px; margin: 0 auto; background: #ffffff; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); border-radius: 16px; overflow: hidden;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">{{NEWSLETTER_TITLE}}</h1>
            <p style="color: #fecaca; margin: 10px 0 0 0; font-size: 16px;">{{DATE}}</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
            <h2 style="color: #1e293b; font-size: 24px; margin: 0 0 20px 0;">{{MAIN_HEADING}}</h2>
            <p style="color: #64748b; line-height: 1.8; font-size: 16px; margin: 0 0 30px 0;">{{MAIN_CONTENT}}</p>

            <!-- Featured Section -->
            <div style="background: #f8fafc; border-radius: 12px; padding: 25px; margin: 30px 0;">
                <h3 style="color: #dc2626; font-size: 20px; margin: 0 0 15px 0;">{{FEATURED_TITLE}}</h3>
                <p style="color: #475569; line-height: 1.6; margin: 0 0 20px 0;">{{FEATURED_CONTENT}}</p>
                <a href="{{FEATURED_LINK}}" style="display: inline-block; background: #dc2626; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">{{FEATURED_CTA}}</a>
            </div>

            <!-- Additional Content -->
            <div style="margin: 30px 0;">
                <h3 style="color: #1e293b; font-size: 18px; margin: 0 0 15px 0;">{{SECONDARY_HEADING}}</h3>
                <p style="color: #64748b; line-height: 1.6; margin: 0;">{{SECONDARY_CONTENT}}</p>
            </div>
        </div>

        <!-- Footer -->
        <div style="background: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0 0 8px 0;">
                © 2024 ElanorraLiving. All rights reserved.
            </p>
            <p style="color: #64748b; font-size: 11px; margin: 0;">
                <a href="{{UNSUBSCRIBE_URL}}" style="color: #dc2626; text-decoration: none;">Unsubscribe</a> | 
                <a href="{{PREFERENCES_URL}}" style="color: #dc2626; text-decoration: none;">Update Preferences</a>
            </p>
        </div>
    </div>
</body>
</html>`,
    textContent: `{{NEWSLETTER_TITLE}} - {{DATE}}

{{MAIN_HEADING}}
{{MAIN_CONTENT}}

{{FEATURED_TITLE}}
{{FEATURED_CONTENT}}
{{FEATURED_CTA}}: {{FEATURED_LINK}}

{{SECONDARY_HEADING}}
{{SECONDARY_CONTENT}}

---
© 2024 ElanorraLiving. All rights reserved.
Unsubscribe: {{UNSUBSCRIBE_URL}}
Update Preferences: {{PREFERENCES_URL}}`,
    variables: {
      NEWSLETTER_TITLE: "ElanorraLiving Newsletter",
      DATE: "Current Date",
      MAIN_HEADING: "Main Article Title",
      MAIN_CONTENT: "Main article content",
      FEATURED_TITLE: "Featured Section Title",
      FEATURED_CONTENT: "Featured section content",
      FEATURED_LINK: "Featured link URL",
      FEATURED_CTA: "Call to Action Text",
      SECONDARY_HEADING: "Secondary Article Title",
      SECONDARY_CONTENT: "Secondary article content",
      UNSUBSCRIBE_URL: "Unsubscribe link",
      PREFERENCES_URL: "Preferences link"
    },
    isActive: true,
    isDefault: true,
  },
  {
    name: "Promotional Template",
    description: "Perfect for sales and offers",
    category: "promotional",
    subject: "🎉 {{OFFER_TITLE}} - Limited Time Only!",
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{OFFER_TITLE}}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); border-radius: 16px; overflow: hidden;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800;">{{OFFER_TITLE}}</h1>
            <p style="color: #fef3c7; margin: 15px 0 0 0; font-size: 18px; font-weight: 500;">{{OFFER_SUBTITLE}}</p>
        </div>

        <!-- Discount Badge -->
        <div style="text-align: center; margin: -20px 0 0 0; position: relative; z-index: 10;">
            <div style="display: inline-block; background: #dc2626; color: #ffffff; padding: 15px 30px; border-radius: 50px; font-size: 24px; font-weight: 700; box-shadow: 0 5px 15px rgba(220, 38, 38, 0.3);">
                {{DISCOUNT_AMOUNT}} OFF
            </div>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #1e293b; font-size: 28px; margin: 0 0 15px 0;">{{MAIN_HEADING}}</h2>
                <p style="color: #64748b; line-height: 1.8; font-size: 18px; margin: 0;">{{MAIN_CONTENT}}</p>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 40px 0;">
                <a href="{{CTA_LINK}}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: #ffffff; padding: 18px 40px; text-decoration: none; border-radius: 50px; font-size: 18px; font-weight: 700; box-shadow: 0 5px 15px rgba(220, 38, 38, 0.3); transition: all 0.3s ease;">{{CTA_TEXT}}</a>
            </div>

            <!-- Urgency -->
            <div style="background: #fef2f2; border: 2px solid #fecaca; border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0;">
                <p style="color: #dc2626; font-size: 16px; font-weight: 600; margin: 0;">⏰ {{URGENCY_TEXT}}</p>
            </div>

            <!-- Terms -->
            <div style="margin: 30px 0;">
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">{{TERMS_CONDITIONS}}</p>
            </div>
        </div>

        <!-- Footer -->
        <div style="background: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0 0 8px 0;">
                © 2024 ElanorraLiving. All rights reserved.
            </p>
            <p style="color: #64748b; font-size: 11px; margin: 0;">
                <a href="{{UNSUBSCRIBE_URL}}" style="color: #dc2626; text-decoration: none;">Unsubscribe</a>
            </p>
        </div>
    </div>
</body>
</html>`,
    textContent: `{{OFFER_TITLE}}
{{OFFER_SUBTITLE}}

{{DISCOUNT_AMOUNT}} OFF

{{MAIN_HEADING}}
{{MAIN_CONTENT}}

{{CTA_TEXT}}: {{CTA_LINK}}

⏰ {{URGENCY_TEXT}}

{{TERMS_CONDITIONS}}

---
© 2024 ElanorraLiving. All rights reserved.
Unsubscribe: {{UNSUBSCRIBE_URL}}`,
    variables: {
      OFFER_TITLE: "Special Offer",
      OFFER_SUBTITLE: "Limited time promotion",
      DISCOUNT_AMOUNT: "25%",
      MAIN_HEADING: "Don't Miss Out!",
      MAIN_CONTENT: "This exclusive offer won't last long. Shop now and save big on your favorite items.",
      CTA_LINK: `${process.env.NEXTAUTH_URL}/shop`,
      CTA_TEXT: "Shop Now",
      URGENCY_TEXT: "Offer expires in 48 hours!",
      TERMS_CONDITIONS: "Terms and conditions apply. Valid until specified date.",
      UNSUBSCRIBE_URL: "Unsubscribe link"
    },
    isActive: true,
    isDefault: true,
  }
];

// POST - Seed default email templates
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    // Check if templates already exist
    const existingTemplates = await prisma.emailTemplate.count();
    if (existingTemplates > 0) {
      return NextResponse.json(
        { message: "Templates already exist", count: existingTemplates },
        { status: 200 }
      );
    }

    // Create default templates
    const createdTemplates = await Promise.all(
      defaultTemplates.map(template =>
        prisma.emailTemplate.create({ data: template })
      )
    );

    return NextResponse.json({
      message: "Default templates created successfully",
      templates: createdTemplates,
      count: createdTemplates.length
    });
  } catch (error) {
    console.error("Error seeding email templates:", error);
    return NextResponse.json(
      { error: "Failed to seed email templates" },
      { status: 500 }
    );
  }
}