import { NextRequest, NextResponse } from 'next/server';
import { sendPromotionalEmail, sendPromotionalCampaign } from '@/lib/email';
import { z } from 'zod';

// Schema for single promotional email request
const promotionalEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required'),
  templateData: z.object({
    offer: z.string().optional(),
    message: z.string().optional(),
    ctaText: z.string().optional(),
    ctaUrl: z.string().url().optional(),
    discount_code: z.string().optional(),
  }).catchall(z.any()), // Allow additional properties
  campaignId: z.string().optional(),
});

// Schema for bulk promotional campaign request
const promotionalCampaignSchema = z.object({
  recipients: z.array(z.string().email()).min(1, 'At least one recipient is required'),
  subject: z.string().min(1, 'Subject is required'),
  templateData: z.object({
    offer: z.string().optional(),
    message: z.string().optional(),
    ctaText: z.string().optional(),
    ctaUrl: z.string().url().optional(),
    discount_code: z.string().optional(),
  }).catchall(z.any()), // Allow additional properties
  campaignId: z.string().optional(),
});

// Send single promotional email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = promotionalEmailSchema.parse(body);
    
    // Send promotional email
    const success = await sendPromotionalEmail(validatedData);
    
    if (success) {
      return NextResponse.json(
        { message: 'Promotional email sent successfully' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to send promotional email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending promotional email:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Send bulk promotional campaign
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = promotionalCampaignSchema.parse(body);
    
    // Send promotional campaign
    const result = await sendPromotionalCampaign(
      validatedData.recipients,
      validatedData.subject,
      validatedData.templateData,
      validatedData.campaignId
    );
    
    return NextResponse.json(
      { 
        message: 'Promotional campaign completed',
        sent: result.sent,
        failed: result.failed,
        total: validatedData.recipients.length
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending promotional campaign:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}