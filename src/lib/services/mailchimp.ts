import { env } from '@/env'; // Assuming an env file for API keys
import { Product } from '@/types';

const MAILCHIMP_API_KEY = env.MAILCHIMP_API_KEY;
const MAILCHIMP_API_SERVER = env.MAILCHIMP_API_SERVER; // e.g., 'us1', 'us2'
const MAILCHIMP_AUDIENCE_ID = env.MAILCHIMP_AUDIENCE_ID;
const MAILCHIMP_TRANSACTIONAL_API_KEY = process.env.MAILCHIMP_TRANSACTIONAL_API_KEY; // Mandrill API key

if (!MAILCHIMP_API_KEY || !MAILCHIMP_API_SERVER || !MAILCHIMP_AUDIENCE_ID) {
  console.warn('Mailchimp environment variables are not fully configured.');
}

const mailchimpBaseUrl = `https://${MAILCHIMP_API_SERVER}.api.mailchimp.com/3.0`;
const mandrillBaseUrl = 'https://mandrillapp.com/api/1.0';

// Types for email functionality
export interface AbandonedCartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  slug: string;
}

export interface AbandonedCartData {
  cartId: string;
  userEmail: string;
  userName?: string;
  items: AbandonedCartItem[];
  subtotal: number;
  cartUrl: string;
  abandonedAt: Date;
}

export interface PromotionalEmailData {
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  templateName: string;
  templateData: Record<string, any>;
  campaignId?: string;
  segmentId?: string;
}

export interface EmailResponse {
  success: boolean;
  message: string;
  messageId?: string;
  error?: string;
}

export async function subscribeToNewsletter(email: string) {
  if (!MAILCHIMP_API_KEY || !MAILCHIMP_API_SERVER || !MAILCHIMP_AUDIENCE_ID) {
    throw new Error('Mailchimp API is not configured.');
  }

  const data = {
    email_address: email,
    status: 'subscribed',
  };

  try {
    const response = await fetch(`${mailchimpBaseUrl}/lists/${MAILCHIMP_AUDIENCE_ID}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `apikey ${MAILCHIMP_API_KEY}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to subscribe to newsletter.');
    }

    return await response.json();
  } catch (error) {
    console.error('Mailchimp subscription error:', error);
    throw error;
  }
}

// Placeholder for abandoned cart functionality - this would typically involve webhooks or a more complex setup
export async function sendAbandonedCartReminder(email: string, cartDetails: AbandonedCartData): Promise<EmailResponse> {
  try {
    // If Mandrill (transactional email) is configured, use it for better deliverability
    if (MAILCHIMP_TRANSACTIONAL_API_KEY) {
      return await sendAbandonedCartViaMandrill(cartDetails);
    }
    
    // Fallback to Mailchimp automation trigger
    return await triggerAbandonedCartAutomation(cartDetails);
  } catch (error) {
    console.error('Abandoned cart email error:', error);
    return {
      success: false,
      message: 'Failed to send abandoned cart reminder',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Send abandoned cart email via Mandrill (Mailchimp's transactional email service)
async function sendAbandonedCartViaMandrill(cartData: AbandonedCartData): Promise<EmailResponse> {
  if (!MAILCHIMP_TRANSACTIONAL_API_KEY) {
    throw new Error('Mandrill API key not configured');
  }

  const templateData = {
    user_name: cartData.userName || 'Valued Customer',
    cart_items: cartData.items.map(item => ({
      name: item.name,
      price: `$${item.price.toFixed(2)}`,
      quantity: item.quantity,
      image: item.image,
      product_url: `${process.env.NEXT_PUBLIC_BASE_URL}/products/${item.slug}`
    })),
    subtotal: `$${cartData.subtotal.toFixed(2)}`,
    cart_url: cartData.cartUrl,
    store_name: process.env.NEXT_PUBLIC_STORE_NAME || 'ElanorraLiving',
    store_url: process.env.NEXT_PUBLIC_BASE_URL || 'https://elanorraliving.in'
  };

  const emailData = {
    key: MAILCHIMP_TRANSACTIONAL_API_KEY,
    template_name: 'abandoned-cart-reminder',
    template_content: [],
    message: {
      to: [{
        email: cartData.userEmail,
        name: cartData.userName,
        type: 'to'
      }],
      subject: `Don't forget your items at ${templateData.store_name}!`,
      from_email: process.env.FROM_EMAIL || 'noreply@elanorra.com',
      from_name: templateData.store_name,
      global_merge_vars: Object.entries(templateData).map(([name, content]) => ({
        name: name.toUpperCase(),
        content
      })),
      tags: ['abandoned-cart', 'ecommerce'],
      track_opens: true,
      track_clicks: true,
      auto_text: true,
      preserve_recipients: false
    }
  };

  const response = await fetch(`${mandrillBaseUrl}/messages/send-template.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to send email via Mandrill');
  }

  const result = await response.json();
  const messageResult = result[0];

  return {
    success: messageResult.status === 'sent' || messageResult.status === 'queued',
    message: `Email ${messageResult.status}`,
    messageId: messageResult._id
  };
}

// Trigger abandoned cart automation in Mailchimp
async function triggerAbandonedCartAutomation(cartData: AbandonedCartData): Promise<EmailResponse> {
  if (!MAILCHIMP_API_KEY || !MAILCHIMP_API_SERVER || !MAILCHIMP_AUDIENCE_ID) {
    throw new Error('Mailchimp API is not configured');
  }

  // First, add/update the subscriber with cart data
  const subscriberData = {
    email_address: cartData.userEmail,
    status: 'subscribed',
    merge_fields: {
      FNAME: cartData.userName?.split(' ')[0] || '',
      LNAME: cartData.userName?.split(' ').slice(1).join(' ') || '',
      CART_ID: cartData.cartId,
      CART_VALUE: cartData.subtotal,
      CART_ITEMS: cartData.items.length,
      CART_URL: cartData.cartUrl,
      ABANDONED_AT: cartData.abandonedAt.toISOString()
    },
    tags: ['abandoned-cart']
  };

  try {
    const response = await fetch(`${mailchimpBaseUrl}/lists/${MAILCHIMP_AUDIENCE_ID}/members/${btoa(cartData.userEmail)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `apikey ${MAILCHIMP_API_KEY}`,
      },
      body: JSON.stringify(subscriberData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update subscriber');
    }

    // Trigger automation workflow (this would need to be set up in Mailchimp)
    // For now, we'll just log success
    console.log(`Abandoned cart data updated for ${cartData.userEmail}. Automation should trigger automatically.`);

    return {
      success: true,
      message: 'Abandoned cart automation triggered successfully'
    };
  } catch (error) {
    throw new Error(`Failed to trigger abandoned cart automation: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Placeholder for promotional emails - similar to abandoned cart, often uses automation or transactional emails
export async function sendPromotionalEmail(emailData: PromotionalEmailData): Promise<EmailResponse> {
  try {
    // If Mandrill (transactional email) is configured, use it for better deliverability
    if (MAILCHIMP_TRANSACTIONAL_API_KEY) {
      return await sendPromotionalViaMandrill(emailData);
    }
    
    // Fallback to Mailchimp campaign
    return await sendPromotionalViaCampaign(emailData);
  } catch (error) {
    console.error('Promotional email error:', error);
    return {
      success: false,
      message: 'Failed to send promotional email',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Send promotional email via Mandrill
async function sendPromotionalViaMandrill(emailData: PromotionalEmailData): Promise<EmailResponse> {
  if (!MAILCHIMP_TRANSACTIONAL_API_KEY) {
    throw new Error('Mandrill API key not configured');
  }

  const mandrillData = {
    key: MAILCHIMP_TRANSACTIONAL_API_KEY,
    template_name: emailData.templateName,
    template_content: [],
    message: {
      to: [{
        email: emailData.recipientEmail,
        name: emailData.recipientName,
        type: 'to'
      }],
      subject: emailData.subject,
      from_email: process.env.FROM_EMAIL || 'noreply@elanorra.com',
      from_name: process.env.NEXT_PUBLIC_STORE_NAME || 'Elanorra',
      global_merge_vars: Object.entries(emailData.templateData).map(([name, content]) => ({
        name: name.toUpperCase(),
        content
      })),
      tags: ['promotional', 'marketing', emailData.campaignId].filter(Boolean),
      track_opens: true,
      track_clicks: true,
      auto_text: true,
      preserve_recipients: false
    }
  };

  const response = await fetch(`${mandrillBaseUrl}/messages/send-template.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(mandrillData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to send promotional email via Mandrill');
  }

  const result = await response.json();
  const messageResult = result[0];

  return {
    success: messageResult.status === 'sent' || messageResult.status === 'queued',
    message: `Promotional email ${messageResult.status}`,
    messageId: messageResult._id
  };
}

// Send promotional email via Mailchimp campaign
async function sendPromotionalViaCampaign(emailData: PromotionalEmailData): Promise<EmailResponse> {
  if (!MAILCHIMP_API_KEY || !MAILCHIMP_API_SERVER || !MAILCHIMP_AUDIENCE_ID) {
    throw new Error('Mailchimp API is not configured');
  }

  // First, ensure the recipient is in the audience
  const subscriberData = {
    email_address: emailData.recipientEmail,
    status: 'subscribed',
    merge_fields: {
      FNAME: emailData.recipientName?.split(' ')[0] || '',
      LNAME: emailData.recipientName?.split(' ').slice(1).join(' ') || '',
      ...Object.fromEntries(
        Object.entries(emailData.templateData).map(([key, value]) => [
          key.toUpperCase().substring(0, 10), // Mailchimp merge field names are limited
          String(value)
        ])
      )
    },
    tags: ['promotional', emailData.campaignId].filter(Boolean)
  };

  try {
    // Add/update subscriber
    await fetch(`${mailchimpBaseUrl}/lists/${MAILCHIMP_AUDIENCE_ID}/members/${btoa(emailData.recipientEmail)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `apikey ${MAILCHIMP_API_KEY}`,
      },
      body: JSON.stringify(subscriberData),
    });

    // Create a segment for this specific email if segmentId is provided
    let segmentId = emailData.segmentId;
    if (!segmentId) {
      const segmentData = {
        name: `Promotional Email - ${Date.now()}`,
        static_segment: [emailData.recipientEmail]
      };

      const segmentResponse = await fetch(`${mailchimpBaseUrl}/lists/${MAILCHIMP_AUDIENCE_ID}/segments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `apikey ${MAILCHIMP_API_KEY}`,
        },
        body: JSON.stringify(segmentData),
      });

      if (segmentResponse.ok) {
        const segment = await segmentResponse.json();
        segmentId = segment.id;
      }
    }

    // Create and send campaign
    const campaignData = {
      type: 'regular',
      recipients: {
        list_id: MAILCHIMP_AUDIENCE_ID,
        segment_opts: segmentId ? {
          saved_segment_id: segmentId
        } : undefined
      },
      settings: {
        subject_line: emailData.subject,
        from_name: process.env.NEXT_PUBLIC_STORE_NAME || 'Elanorra',
        reply_to: process.env.FROM_EMAIL || 'noreply@elanorra.com',
        title: `Promotional Email - ${emailData.campaignId || Date.now()}`
      }
    };

    const campaignResponse = await fetch(`${mailchimpBaseUrl}/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `apikey ${MAILCHIMP_API_KEY}`,
      },
      body: JSON.stringify(campaignData),
    });

    if (!campaignResponse.ok) {
      const errorData = await campaignResponse.json();
      throw new Error(errorData.detail || 'Failed to create campaign');
    }

    const campaign = await campaignResponse.json();

    // Set campaign content (this would typically use a template)
    const contentData = {
      html: generatePromotionalEmailHTML(emailData)
    };

    await fetch(`${mailchimpBaseUrl}/campaigns/${campaign.id}/content`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `apikey ${MAILCHIMP_API_KEY}`,
      },
      body: JSON.stringify(contentData),
    });

    // Send the campaign
    const sendResponse = await fetch(`${mailchimpBaseUrl}/campaigns/${campaign.id}/actions/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `apikey ${MAILCHIMP_API_KEY}`,
      },
    });

    if (!sendResponse.ok) {
      const errorData = await sendResponse.json();
      throw new Error(errorData.detail || 'Failed to send campaign');
    }

    return {
      success: true,
      message: 'Promotional email campaign sent successfully',
      messageId: campaign.id
    };
  } catch (error) {
    throw new Error(`Failed to send promotional email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Generate HTML content for promotional emails
function generatePromotionalEmailHTML(emailData: PromotionalEmailData): string {
  const { templateData } = emailData;
  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || 'Elanorra';
  const storeUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://elanorra.com';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${emailData.subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .content { margin-bottom: 30px; }
        .cta-button { 
          display: inline-block; 
          padding: 12px 24px; 
          background-color: #007bff; 
          color: white; 
          text-decoration: none; 
          border-radius: 5px; 
          margin: 20px 0;
        }
        .footer { text-align: center; font-size: 12px; color: #666; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${storeName}</h1>
        </div>
        <div class="content">
          <h2>${emailData.subject}</h2>
          <p>Hello ${emailData.recipientName || 'Valued Customer'},</p>
          ${templateData.message || '<p>We have an exciting offer just for you!</p>'}
          ${templateData.offer ? `<p><strong>${templateData.offer}</strong></p>` : ''}
          ${templateData.ctaText && templateData.ctaUrl ? 
            `<p><a href="${templateData.ctaUrl}" class="cta-button">${templateData.ctaText}</a></p>` : 
            `<p><a href="${storeUrl}" class="cta-button">Shop Now</a></p>`
          }
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${storeName}. All rights reserved.</p>
          <p><a href="${storeUrl}/unsubscribe">Unsubscribe</a> | <a href="${storeUrl}">Visit our website</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Helper functions for cart abandonment tracking
export async function trackCartAbandonment(cartData: AbandonedCartData): Promise<void> {
  // This would typically be called by a cron job or webhook
  // to identify and process abandoned carts
  try {
    console.log(`Tracking cart abandonment for ${cartData.userEmail}`);
    
    // Store abandonment data (could be in database or external service)
    // For now, we'll just trigger the email
    await sendAbandonedCartReminder(cartData.userEmail, cartData);
  } catch (error) {
    console.error('Failed to track cart abandonment:', error);
  }
}

// Helper function to create promotional email campaigns
export async function createPromotionalCampaign(
  recipients: string[],
  subject: string,
  templateName: string,
  templateData: Record<string, any>,
  campaignId?: string
): Promise<EmailResponse[]> {
  const results: EmailResponse[] = [];
  
  for (const email of recipients) {
    try {
      const result = await sendPromotionalEmail({
        recipientEmail: email,
        subject,
        templateName,
        templateData,
        campaignId
      });
      results.push(result);
    } catch (error) {
      results.push({
        success: false,
        message: `Failed to send to ${email}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  return results;
}
