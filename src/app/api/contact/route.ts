import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { emailService } from '@/lib/email';
import { sanitizeText, sanitizeEmail, emailSchema, nameSchema, phoneSchema } from '@/lib/validation';
import { rateLimit, createRateLimitResponse } from '@/lib/rate-limit';

// Contact form validation schema
const contactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject must be less than 200 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message must be less than 2000 characters'),
  service: z.string().optional(),
});

// Rate limit config for contact form
const contactRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3, // 3 contact form submissions per hour
  message: 'Too many contact form submissions. Please try again later.',
});

// Original POST handler (now internal)
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await contactRateLimit(request);
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(
        rateLimitResult.error || 'Too many requests', 
        rateLimitResult.resetTime
      );
    }

    const body = await request.json();
    
    // Validate the request body
    const validatedData = contactSchema.parse(body);
    
    // Sanitize the data
    const sanitizedData = {
      name: sanitizeText(validatedData.name),
      email: sanitizeEmail(validatedData.email),
      phone: validatedData.phone ? sanitizeText(validatedData.phone) : undefined,
      subject: sanitizeText(validatedData.subject),
      message: sanitizeText(validatedData.message),
      service: validatedData.service ? sanitizeText(validatedData.service) : undefined,
    };

    // Send email notification to admin
    const adminEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 20px; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          
          <div style="margin-bottom: 20px;">
            <h3 style="color: #555; margin-bottom: 10px;">Contact Information</h3>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${sanitizedData.name}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${sanitizedData.email}</p>
            ${sanitizedData.phone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${sanitizedData.phone}</p>` : ''}
            ${sanitizedData.service ? `<p style="margin: 5px 0;"><strong>Service Interest:</strong> ${sanitizedData.service}</p>` : ''}
          </div>
          
          <div style="margin-bottom: 20px;">
            <h3 style="color: #555; margin-bottom: 10px;">Subject</h3>
            <p style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; margin: 0;">
              ${sanitizedData.subject}
            </p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h3 style="color: #555; margin-bottom: 10px;">Message</h3>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; white-space: pre-wrap; line-height: 1.6;">
              ${sanitizedData.message}
            </div>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px;">
            <p>This message was sent from the Elanorra contact form.</p>
            <p>Submitted at: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    `;

    const adminEmailText = `
New Contact Form Submission

Contact Information:
Name: ${sanitizedData.name}
Email: ${sanitizedData.email}
${sanitizedData.phone ? `Phone: ${sanitizedData.phone}` : ''}
${sanitizedData.service ? `Service Interest: ${sanitizedData.service}` : ''}

Subject: ${sanitizedData.subject}

Message:
${sanitizedData.message}

Submitted at: ${new Date().toLocaleString()}
    `;

    // Send email to admin
    const adminEmailSent = await emailService.sendEmail({
      to: process.env.ADMIN_EMAIL || 'info@elanorraliving.in',
      subject: `New Contact Form: ${sanitizedData.subject}`,
      html: adminEmailHtml,
      text: adminEmailText,
    });

    // Send confirmation email to user
    const userEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 20px;">Thank you for contacting Elanorra!</h2>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            Hi ${sanitizedData.name},
          </p>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            We've received your message and will get back to you within 24-48 hours. Here's a copy of what you sent:
          </p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Subject:</strong> ${sanitizedData.subject}</p>
            <p style="margin: 15px 0 5px 0;"><strong>Message:</strong></p>
            <div style="white-space: pre-wrap; line-height: 1.6; color: #666;">
              ${sanitizedData.message}
            </div>
          </div>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            If you have any urgent questions, feel free to call us or visit our store.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #333; font-weight: bold; margin-bottom: 10px;">Elanorra Team</p>
            <p style="color: #666; font-size: 14px; margin: 5px 0;">Email: info@elanorra.com</p>
            <p style="color: #666; font-size: 14px; margin: 5px 0;">Phone: +1 (555) 123-4567</p>
            <p style="color: #666; font-size: 14px; margin: 5px 0;">Website: www.elanorra.com</p>
          </div>
        </div>
      </div>
    `;

    const userEmailText = `
Thank you for contacting Elanorra!

Hi ${sanitizedData.name},

We've received your message and will get back to you within 24-48 hours. Here's a copy of what you sent:

Subject: ${sanitizedData.subject}

Message:
${sanitizedData.message}

If you have any urgent questions, feel free to call us or visit our store.

Elanorra Team
Email: info@elanorra.com
Phone: +1 (555) 123-4567
Website: www.elanorra.com
    `;

    // Send confirmation email to user
    const userEmailSent = await emailService.sendEmail({
      to: sanitizedData.email,
      subject: 'Thank you for contacting Elanorra - We\'ll be in touch soon!',
      html: userEmailHtml,
      text: userEmailText,
    });

    // Log the contact form submission (you might want to save to database)
    console.log('Contact form submission:', {
      name: sanitizedData.name,
      email: sanitizedData.email,
      subject: sanitizedData.subject,
      timestamp: new Date().toISOString(),
      adminEmailSent,
      userEmailSent,
    });

    return NextResponse.json(
      { 
        message: 'Thank you for your message! We\'ll get back to you soon.',
        success: true 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Contact form error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Please check your form data and try again.',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Something went wrong. Please try again later.' },
      { status: 500 }
    );
  }
}