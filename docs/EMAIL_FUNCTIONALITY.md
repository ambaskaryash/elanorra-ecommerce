# Email Functionality Documentation

This document outlines the comprehensive email functionality implemented in the Elanorra e-commerce application, including abandoned cart reminders and promotional email campaigns.

## Overview

The email system supports two primary use cases:
1. **Abandoned Cart Recovery** - Automated emails to recover lost sales
2. **Promotional Campaigns** - Marketing emails for customer engagement

The system is built with flexibility to use either:
- **Mailchimp Transactional (Mandrill)** - For high-deliverability transactional emails
- **Mailchimp Marketing** - For campaign-based emails and automation

## Configuration

### Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Required Mailchimp Configuration
MAILCHIMP_API_KEY=your_mailchimp_api_key
MAILCHIMP_API_SERVER=us1  # Your Mailchimp server (us1, us2, etc.)
MAILCHIMP_AUDIENCE_ID=your_audience_list_id

# Optional Transactional Email (Mandrill)
MAILCHIMP_TRANSACTIONAL_API_KEY=your_mandrill_api_key

# Email Settings
FROM_EMAIL=noreply@yourdomain.com
NEXT_PUBLIC_STORE_NAME=Your Store Name
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### Getting API Keys

1. **Mailchimp API Key**: 
   - Go to Mailchimp → Account → Extras → API Keys
   - Generate a new API key

2. **Mailchimp Server**: 
   - Found in your Mailchimp URL (e.g., `us1.admin.mailchimp.com` = `us1`)

3. **Audience ID**: 
   - Go to Audience → Settings → Audience name and defaults
   - Copy the Audience ID

4. **Mandrill API Key** (Optional):
   - Enable Mandrill in your Mailchimp account
   - Go to Mandrill → Settings → SMTP & API Info
   - Generate API key

## Abandoned Cart Functionality

### Features

- **Automatic Detection**: Track when users abandon their carts
- **Smart Timing**: Configurable delay before sending reminders
- **Rich Content**: Include product images, prices, and direct cart links
- **Fallback Support**: Works with both Mandrill and Mailchimp automation

### Usage

```typescript
import { sendAbandonedCartReminder, AbandonedCartData } from '@/lib/services/mailchimp';

const cartData: AbandonedCartData = {
  cartId: 'cart_123',
  userEmail: 'customer@example.com',
  userName: 'John Doe',
  items: [
    {
      productId: 'prod_1',
      name: 'Premium T-Shirt',
      price: 29.99,
      quantity: 2,
      image: 'https://example.com/image.jpg',
      slug: 'premium-t-shirt'
    }
  ],
  subtotal: 59.98,
  cartUrl: 'https://yourdomain.com/cart?restore=cart_123',
  abandonedAt: new Date()
};

const result = await sendAbandonedCartReminder(cartData.userEmail, cartData);
console.log(result); // { success: true, message: "Email sent", messageId: "..." }
```

### Cart Tracking Helper

```typescript
import { trackCartAbandonment } from '@/lib/services/mailchimp';

// Call this from a cron job or webhook
await trackCartAbandonment(cartData);
```

## Promotional Email Functionality

### Features

- **Template Support**: Use Mandrill templates or generate HTML
- **Bulk Campaigns**: Send to multiple recipients
- **Segmentation**: Target specific customer groups
- **Tracking**: Open and click tracking enabled
- **Personalization**: Dynamic content based on customer data

### Usage

#### Single Promotional Email

```typescript
import { sendPromotionalEmail, PromotionalEmailData } from '@/lib/services/mailchimp';

const emailData: PromotionalEmailData = {
  recipientEmail: 'customer@example.com',
  recipientName: 'John Doe',
  subject: 'Exclusive 20% Off Sale!',
  templateName: 'promotional-template',
  templateData: {
    offer: '20% OFF Everything',
    message: 'Limited time offer just for you!',
    ctaText: 'Shop Now',
    ctaUrl: 'https://yourdomain.com/sale',
    discount_code: 'SAVE20'
  },
  campaignId: 'summer_sale_2024'
};

const result = await sendPromotionalEmail(emailData);
```

#### Bulk Promotional Campaign

```typescript
import { createPromotionalCampaign } from '@/lib/services/mailchimp';

const recipients = ['user1@example.com', 'user2@example.com'];
const results = await createPromotionalCampaign(
  recipients,
  'Summer Sale - 50% Off!',
  'summer-sale-template',
  {
    discount: '50%',
    message: 'Our biggest sale of the year!',
    ctaText: 'Shop Sale',
    ctaUrl: 'https://yourdomain.com/summer-sale'
  },
  'summer_sale_2024'
);
```

## Email Templates

### Mandrill Templates

Create templates in your Mandrill account with these merge variables:

#### Abandoned Cart Template (`abandoned-cart-reminder`)
- `USER_NAME` - Customer name
- `CART_ITEMS` - Array of cart items
- `SUBTOTAL` - Cart subtotal
- `CART_URL` - Link to restore cart
- `STORE_NAME` - Your store name
- `STORE_URL` - Your store URL

#### Promotional Template (`promotional-template`)
- `RECIPIENT_NAME` - Customer name
- `OFFER` - Promotional offer text
- `MESSAGE` - Email message
- `CTA_TEXT` - Call-to-action button text
- `CTA_URL` - Call-to-action URL
- Custom variables from `templateData`

### HTML Email Generation

For Mailchimp campaigns, emails are generated with responsive HTML including:
- Mobile-friendly design
- Professional styling
- Unsubscribe links
- Store branding

## Integration Examples

### E-commerce Integration

```typescript
// In your cart service
import { trackCartAbandonment } from '@/lib/services/mailchimp';

export class CartService {
  async abandonCart(cartId: string) {
    const cart = await this.getCart(cartId);
    
    if (cart.items.length > 0) {
      const cartData: AbandonedCartData = {
        cartId: cart.id,
        userEmail: cart.userEmail,
        userName: cart.userName,
        items: cart.items.map(item => ({
          productId: item.productId,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          image: item.product.images[0]?.src,
          slug: item.product.slug
        })),
        subtotal: cart.subtotal,
        cartUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/cart?restore=${cart.id}`,
        abandonedAt: new Date()
      };
      
      // Schedule abandoned cart email (typically after 1-24 hours)
      await scheduleAbandonedCartEmail(cartData);
    }
  }
}
```

### Marketing Integration

```typescript
// In your marketing service
import { createPromotionalCampaign } from '@/lib/services/mailchimp';

export class MarketingService {
  async sendNewsletter(segmentId: string, subject: string, content: any) {
    const subscribers = await this.getSubscribers(segmentId);
    const emails = subscribers.map(sub => sub.email);
    
    return await createPromotionalCampaign(
      emails,
      subject,
      'newsletter-template',
      content,
      `newsletter_${Date.now()}`
    );
  }
}
```

## Error Handling

All email functions return a standardized `EmailResponse`:

```typescript
interface EmailResponse {
  success: boolean;
  message: string;
  messageId?: string;
  error?: string;
}
```

Handle errors gracefully:

```typescript
const result = await sendPromotionalEmail(emailData);

if (!result.success) {
  console.error('Email failed:', result.error);
  // Implement retry logic or fallback
} else {
  console.log('Email sent successfully:', result.messageId);
}
```

## Best Practices

### Performance
- Use Mandrill for transactional emails (better deliverability)
- Use Mailchimp campaigns for bulk marketing emails
- Implement queue system for bulk operations
- Add rate limiting to prevent API abuse

### Deliverability
- Maintain clean email lists
- Use double opt-in for subscriptions
- Include unsubscribe links
- Monitor bounce rates and spam complaints
- Authenticate your domain (SPF, DKIM, DMARC)

### Content
- Personalize email content
- Use responsive email templates
- Include clear call-to-action buttons
- Test emails across different clients
- A/B test subject lines and content

### Compliance
- Follow CAN-SPAM Act guidelines
- Implement GDPR compliance for EU customers
- Provide easy unsubscribe options
- Honor opt-out requests immediately
- Include physical address in emails

## Monitoring and Analytics

### Mailchimp Analytics
- Open rates
- Click-through rates
- Bounce rates
- Unsubscribe rates
- Revenue tracking

### Custom Tracking
```typescript
// Track email performance
const result = await sendPromotionalEmail(emailData);
if (result.success) {
  await analytics.track('email_sent', {
    type: 'promotional',
    recipient: emailData.recipientEmail,
    campaign: emailData.campaignId,
    messageId: result.messageId
  });
}
```

## Troubleshooting

### Common Issues

1. **API Key Errors**
   - Verify API keys are correct
   - Check API key permissions
   - Ensure server prefix matches your account

2. **Template Not Found**
   - Verify template exists in Mandrill
   - Check template name spelling
   - Ensure template is published

3. **Subscriber Errors**
   - Check if email exists in audience
   - Verify audience ID is correct
   - Handle unsubscribed users

4. **Rate Limiting**
   - Implement exponential backoff
   - Use bulk operations when possible
   - Monitor API usage limits

### Debug Mode

Enable debug logging:

```typescript
// Set environment variable
DEBUG_EMAIL=true

// Or modify the service
console.log('Email debug:', { emailData, result });
```

## Migration Guide

### From Basic to Advanced Setup

1. **Add Mandrill**: Enable transactional emails for better deliverability
2. **Create Templates**: Move from generated HTML to professional templates
3. **Implement Automation**: Set up Mailchimp automation workflows
4. **Add Analytics**: Track email performance and ROI
5. **Optimize Timing**: A/B test send times and frequency

This comprehensive email system provides a solid foundation for customer engagement and cart recovery, with room for future enhancements and optimizations.