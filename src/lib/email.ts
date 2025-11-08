// Email service for sending transactional emails using nodemailer
import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    path: string;
    contentType: string;
  }>;
}

interface PasswordResetEmailData {
  email: string;
  firstName?: string;
  resetToken: string;
  resetUrl: string;
}

interface WelcomeEmailData {
  email: string;
  firstName?: string;
  verificationUrl?: string;
}

interface NewsletterCampaignData {
  subject: string;
  htmlContent: string;
  textContent?: string;
  unsubscribeUrl: string;
  variables?: Record<string, string>;
}

interface NewsletterWelcomeData {
  email: string;
  firstName?: string;
  lastName?: string;
  unsubscribeUrl: string;
}

interface WeeklyNewsletterData {
  email: string;
  firstName?: string;
  lastName?: string;
  unsubscribeUrl: string;
  weekNumber: number;
  featuredProducts?: Array<{
    name: string;
    price: number;
    description?: string;
    image?: string;
    link: string;
  }>;
  designTips?: Array<{
    title: string;
    content: string;
    link?: string;
  }>;
  specialOffers?: Array<{
    title: string;
    description: string;
    code?: string;
    link: string;
    ctaText?: string;
  }>;
  blogPosts?: Array<{
    title: string;
    excerpt: string;
    image?: string;
    link: string;
  }>;
  newArrivals?: Array<{
    name: string;
    price: number;
    description?: string;
    image?: string;
    link: string;
  }>;
}

interface OrderConfirmationEmailData {
  email: string;
  orderNumber: string;
  orderId: string;
  customerName?: string;
  totalPrice: number;
  subtotal: number;
  taxes: number;
  shipping: number;
  discount?: number;
  currency: string;
  paymentMethod?: string;
  createdAt: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    image?: string;
    variants?: Record<string, unknown>;
  }>;
  shippingAddress: {
    firstName: string;
    lastName: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
  };
  billingAddress?: {
    firstName: string;
    lastName: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
  };
}

interface ShippingNotificationEmailData {
  email: string;
  orderNumber: string;
  orderId: string;
  customerName?: string;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    image?: string;
  }>;
}

interface AbandonedCartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  slug: string;
}

interface AbandonedCartEmailData {
  email: string;
  cartId: string;
  customerName?: string;
  items: AbandonedCartItem[];
  subtotal: number;
  cartUrl: string;
  abandonedAt: Date;
}

interface PromotionalEmailData {
  email: string;
  customerName?: string;
  subject: string;
  templateData: {
    offer?: string;
    message?: string;
    ctaText?: string;
    ctaUrl?: string;
    discount_code?: string;
    [key: string]: any;
  };
  campaignId?: string;
}

interface InvoiceEmailData {
  email: string;
  customerName?: string;
  orderNumber: string;
  invoiceNumber: string;
  totalAmount: number;
  currency: string;
  invoiceFilePath: string;
  createdAt: string;
}

// Helper function to replace template variables
function replaceTemplateVariables(
  content: string, 
  variables: Record<string, string> = {}
): string {
  let processedContent = content;
  
  // Replace all {{VARIABLE}} placeholders with actual values
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    processedContent = processedContent.replace(regex, value || '');
  });
  
  // Remove any remaining unreplaced placeholders (optional - you might want to keep them)
  // processedContent = processedContent.replace(/\{\{[^}]+\}\}/g, '');
  
  return processedContent;
}

// Email service with nodemailer
class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  async sendWeeklyNewsletter(data: WeeklyNewsletterData): Promise<boolean> {
    const { 
      email, 
      firstName, 
      lastName, 
      unsubscribeUrl, 
      weekNumber, 
      featuredProducts = [], 
      designTips = [], 
      specialOffers = [], 
      blogPosts = [],
      newArrivals = []
    } = data;
    
    const displayName = firstName ? (lastName ? `${firstName} ${lastName}` : firstName) : 'Valued Customer';
    const currentDate = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ElanorraLiving Weekly - Week ${weekNumber} | Luxury Home Updates & Exclusive Offers</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); min-height: 100vh;">
        <div style="max-width: 650px; margin: 0 auto; background: #ffffff; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); border-radius: 16px; overflow: hidden;">
          
          <!-- Header with gradient background -->
          <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 30px; text-align: center; position: relative;">
            <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 12px; padding: 20px; display: inline-block;">
              <div style="display: inline-block; background: rgba(255, 255, 255, 0.95); border-radius: 12px; padding: 12px; margin-bottom: 16px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 48 48" style="display: block;">
                  <defs>
                    <linearGradient id="weekly-logo-gradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" style="stop-color:#dc2626"/>
                      <stop offset="100%" style="stop-color:#ef4444"/>
                    </linearGradient>
                  </defs>
                  <path d="M24 4L6 14v20c0 11.05 7.95 20 18 20s18-8.95 18-20V14L24 4z" fill="url(#weekly-logo-gradient)"/>
                  <path d="M24 16l-8 6v12h16V22l-8-6z" fill="white" opacity="0.9"/>
                </svg>
              </div>
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                ElanorraLiving Weekly
              </h1>
              <p style="color: rgba(255, 255, 255, 0.9); font-size: 14px; margin: 8px 0 0 0; font-weight: 500;">
                Week ${weekNumber} • ${currentDate}
              </p>
            </div>
          </div>

          <!-- Personal Greeting -->
          <div style="padding: 30px 30px 20px 30px;">
            <div style="text-align: center; margin-bottom: 25px;">
              <h2 style="color: #1e293b; font-size: 22px; font-weight: 600; margin: 0 0 10px 0;">
                Hello ${displayName}! 👋
              </h2>
              <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0;">
                Welcome to your weekly dose of luxury living inspiration, exclusive offers, and the latest trends in premium home décor.
              </p>
            </div>

            ${specialOffers.length > 0 ? `
            <!-- Special Offers Section -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 16px; padding: 25px; margin: 25px 0; border: 2px solid #f59e0b; text-align: center;">
              <h3 style="color: #92400e; font-size: 20px; font-weight: 700; margin: 0 0 15px 0;">
                🔥 This Week's Exclusive Offers
              </h3>
              ${specialOffers.map(offer => `
                <div style="background: rgba(255, 255, 255, 0.8); border-radius: 12px; padding: 15px; margin: 10px 0; text-align: left;">
                  <h4 style="color: #92400e; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">${offer.title}</h4>
                  <p style="color: #78350f; font-size: 14px; margin: 0 0 10px 0;">${offer.description}</p>
                  ${offer.code ? `<p style="color: #92400e; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">Code: <strong>${offer.code}</strong></p>` : ''}
                  <a href="${offer.link}?utm_source=email&utm_medium=weekly&utm_campaign=special_offer" 
                     style="display: inline-block; background: #f59e0b; color: #ffffff; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 12px;">
                    ${offer.ctaText || 'Shop Now'}
                  </a>
                </div>
              `).join('')}
            </div>
            ` : ''}

            ${newArrivals.length > 0 ? `
            <!-- New Arrivals Section -->
            <div style="margin: 30px 0;">
              <h3 style="color: #1e293b; font-size: 20px; font-weight: 600; margin: 0 0 20px 0; text-align: center; border-bottom: 2px solid #dc2626; padding-bottom: 10px; display: inline-block; width: 100%;">
                ✨ New Arrivals This Week
              </h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
                ${newArrivals.slice(0, 4).map(product => `
                  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; text-align: center; transition: all 0.3s ease;">
                    ${product.image ? `<img src="${product.image}" alt="${product.name}" style="width: 100%; height: 180px; object-fit: cover; border-radius: 8px; margin-bottom: 12px;">` : ''}
                    <h4 style="color: #1e293b; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">${product.name}</h4>
                    <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0; line-height: 1.4;">${product.description || ''}</p>
                    <p style="color: #dc2626; font-size: 18px; font-weight: 700; margin: 0 0 12px 0;">$${product.price}</p>
                    <a href="${product.link}?utm_source=email&utm_medium=weekly&utm_campaign=new_arrivals" 
                       style="display: inline-block; background: #dc2626; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                      View Product
                    </a>
                  </div>
                `).join('')}
              </div>
            </div>
            ` : ''}

            ${featuredProducts.length > 0 ? `
            <!-- Featured Products Section -->
            <div style="margin: 30px 0;">
              <h3 style="color: #1e293b; font-size: 20px; font-weight: 600; margin: 0 0 20px 0; text-align: center; border-bottom: 2px solid #dc2626; padding-bottom: 10px; display: inline-block; width: 100%;">
                🏆 Featured Products
              </h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
                ${featuredProducts.slice(0, 3).map(product => `
                  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; text-align: center; transition: all 0.3s ease;">
                    ${product.image ? `<img src="${product.image}" alt="${product.name}" style="width: 100%; height: 180px; object-fit: cover; border-radius: 8px; margin-bottom: 12px;">` : ''}
                    <h4 style="color: #1e293b; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">${product.name}</h4>
                    <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0; line-height: 1.4;">${product.description || ''}</p>
                    <p style="color: #dc2626; font-size: 18px; font-weight: 700; margin: 0 0 12px 0;">$${product.price}</p>
                    <a href="${product.link}?utm_source=email&utm_medium=weekly&utm_campaign=featured_products" 
                       style="display: inline-block; background: #dc2626; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                      Shop Now
                    </a>
                  </div>
                `).join('')}
              </div>
            </div>
            ` : ''}

            ${designTips.length > 0 ? `
            <!-- Design Tips Section -->
            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 16px; padding: 25px; margin: 30px 0; border-left: 4px solid #0ea5e9;">
              <h3 style="color: #0c4a6e; font-size: 20px; font-weight: 600; margin: 0 0 20px 0; text-align: center;">
                💡 This Week's Design Tips
              </h3>
              ${designTips.map((tip, index) => `
                <div style="background: rgba(255, 255, 255, 0.8); border-radius: 12px; padding: 20px; margin: 15px 0;">
                  <h4 style="color: #0c4a6e; font-size: 16px; font-weight: 600; margin: 0 0 10px 0;">
                    ${index + 1}. ${tip.title}
                  </h4>
                  <p style="color: #164e63; font-size: 14px; margin: 0; line-height: 1.6;">${tip.content}</p>
                  ${tip.link ? `
                    <div style="margin-top: 10px;">
                      <a href="${tip.link}?utm_source=email&utm_medium=weekly&utm_campaign=design_tips" 
                         style="color: #0ea5e9; text-decoration: none; font-weight: 500; font-size: 14px;">
                        Read More →
                      </a>
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
            ` : ''}

            ${blogPosts.length > 0 ? `
            <!-- Blog Posts Section -->
            <div style="margin: 30px 0;">
              <h3 style="color: #1e293b; font-size: 20px; font-weight: 600; margin: 0 0 20px 0; text-align: center; border-bottom: 2px solid #dc2626; padding-bottom: 10px; display: inline-block; width: 100%;">
                📚 Latest from Our Blog
              </h3>
              ${blogPosts.map(post => `
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 15px 0; display: flex; align-items: flex-start; gap: 15px;">
                  ${post.image ? `
                    <div style="flex-shrink: 0;">
                      <img src="${post.image}" alt="${post.title}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">
                    </div>
                  ` : ''}
                  <div style="flex: 1;">
                    <h4 style="color: #1e293b; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">${post.title}</h4>
                    <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0; line-height: 1.5;">${post.excerpt}</p>
                    <a href="${post.link}?utm_source=email&utm_medium=weekly&utm_campaign=blog_posts" 
                       style="color: #dc2626; text-decoration: none; font-weight: 500; font-size: 14px;">
                      Read Full Article →
                    </a>
                  </div>
                </div>
              `).join('')}
            </div>
            ` : ''}

            <!-- Social Proof Section -->
            <div style="background: #fef7f0; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #f97316;">
              <h4 style="color: #ea580c; font-size: 18px; font-weight: 600; margin: 0 0 15px 0; text-align: center;">
                ⭐ Customer Spotlight
              </h4>
              <p style="color: #9a3412; font-size: 14px; margin: 0 0 10px 0; text-align: center; font-style: italic;">
                "This week I received my new dining set from ElanorraLiving and I'm absolutely in love! The craftsmanship is exceptional and it's transformed our dining room into a luxury space." - Jennifer K.
              </p>
              <div style="text-align: center;">
                <a href="${process.env.NEXTAUTH_URL}/reviews?utm_source=email&utm_medium=weekly&utm_campaign=customer_spotlight" 
                   style="color: #ea580c; text-decoration: none; font-weight: 500; font-size: 14px;">
                  Share Your Story →
                </a>
              </div>
            </div>

            <!-- Quick Shop Categories -->
            <div style="margin: 30px 0;">
              <h3 style="color: #1e293b; font-size: 18px; font-weight: 600; margin: 0 0 20px 0; text-align: center;">
                Quick Shop by Category
              </h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px;">
                <a href="${process.env.NEXTAUTH_URL}/categories/living-room?utm_source=email&utm_medium=weekly&utm_campaign=quick_shop" 
                   style="display: block; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; text-decoration: none; text-align: center; transition: all 0.3s ease;">
                  <div style="font-size: 20px; margin-bottom: 6px;">🛋️</div>
                  <h4 style="color: #1e293b; font-size: 12px; font-weight: 600; margin: 0;">Living Room</h4>
                </a>
                <a href="${process.env.NEXTAUTH_URL}/categories/bedroom?utm_source=email&utm_medium=weekly&utm_campaign=quick_shop" 
                   style="display: block; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; text-decoration: none; text-align: center; transition: all 0.3s ease;">
                  <div style="font-size: 20px; margin-bottom: 6px;">🛏️</div>
                  <h4 style="color: #1e293b; font-size: 12px; font-weight: 600; margin: 0;">Bedroom</h4>
                </a>
                <a href="${process.env.NEXTAUTH_URL}/categories/dining?utm_source=email&utm_medium=weekly&utm_campaign=quick_shop" 
                   style="display: block; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; text-decoration: none; text-align: center; transition: all 0.3s ease;">
                  <div style="font-size: 20px; margin-bottom: 6px;">🍽️</div>
                  <h4 style="color: #1e293b; font-size: 12px; font-weight: 600; margin: 0;">Dining</h4>
                </a>
                <a href="${process.env.NEXTAUTH_URL}/categories/decor?utm_source=email&utm_medium=weekly&utm_campaign=quick_shop" 
                   style="display: block; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; text-decoration: none; text-align: center; transition: all 0.3s ease;">
                  <div style="font-size: 20px; margin-bottom: 6px;">🎨</div>
                  <h4 style="color: #1e293b; font-size: 12px; font-weight: 600; margin: 0;">Décor</h4>
                </a>
              </div>
            </div>

            <!-- Social Media -->
            <div style="text-align: center; margin: 30px 0;">
              <h4 style="color: #1e293b; font-size: 16px; font-weight: 600; margin: 0 0 15px 0;">
                Follow Us for Daily Inspiration
              </h4>
              <div style="display: inline-flex; gap: 12px;">
                <a href="${process.env.NEXTAUTH_URL}/social/facebook?utm_source=email&utm_medium=weekly&utm_campaign=social" style="display: inline-block; width: 36px; height: 36px; background: #1877f2; border-radius: 50%; text-decoration: none; color: white; text-align: center; line-height: 36px; font-size: 16px;">📘</a>
                <a href="${process.env.NEXTAUTH_URL}/social/instagram?utm_source=email&utm_medium=weekly&utm_campaign=social" style="display: inline-block; width: 36px; height: 36px; background: #e4405f; border-radius: 50%; text-decoration: none; color: white; text-align: center; line-height: 36px; font-size: 16px;">📷</a>
                <a href="${process.env.NEXTAUTH_URL}/social/pinterest?utm_source=email&utm_medium=weekly&utm_campaign=social" style="display: inline-block; width: 36px; height: 36px; background: #bd081c; border-radius: 50%; text-decoration: none; color: white; text-align: center; line-height: 36px; font-size: 16px;">📌</a>
                <a href="${process.env.NEXTAUTH_URL}/social/youtube?utm_source=email&utm_medium=weekly&utm_campaign=social" style="display: inline-block; width: 36px; height: 36px; background: #ff0000; border-radius: 50%; text-decoration: none; color: white; text-align: center; line-height: 36px; font-size: 16px;">📺</a>
              </div>
            </div>

            <!-- Unsubscribe notice -->
            <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 30px 0; border-left: 4px solid #dc2626;">
              <p style="color: #64748b; font-size: 14px; margin: 0; text-align: center;">
                You're receiving this weekly newsletter because you subscribed to ElanorraLiving updates. 
                <a href="${unsubscribeUrl}" style="color: #dc2626; text-decoration: none;">Unsubscribe</a> | 
                <a href="${process.env.NEXTAUTH_URL}/newsletter/preferences?email=${encodeURIComponent(email)}" style="color: #dc2626; text-decoration: none;">Update Preferences</a>
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0 0 8px 0; font-weight: 500;">
              © 2024 ElanorraLiving. All rights reserved.
            </p>
            <p style="color: #64748b; font-size: 11px; margin: 0; line-height: 1.4;">
              ElanorraLiving - Premium Home Furniture & Décor<br>
              Transforming houses into luxury homes since 2024<br>
              For support, visit our <a href="${process.env.NEXTAUTH_URL}/contact" style="color: #dc2626; text-decoration: none;">contact page</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      ElanorraLiving Weekly - Week ${weekNumber}
      ${currentDate}
      
      Hello ${displayName}!
      
      Welcome to your weekly dose of luxury living inspiration, exclusive offers, and the latest trends in premium home décor.
      
      ${specialOffers.length > 0 ? `
      🔥 THIS WEEK'S EXCLUSIVE OFFERS:
      ${specialOffers.map(offer => `
      - ${offer.title}
        ${offer.description}
        ${offer.code ? `Code: ${offer.code}` : ''}
        Shop: ${offer.link}?utm_source=email&utm_medium=weekly&utm_campaign=special_offer
      `).join('')}
      ` : ''}
      
      ${newArrivals.length > 0 ? `
      ✨ NEW ARRIVALS THIS WEEK:
      ${newArrivals.slice(0, 4).map(product => `
      - ${product.name} - $${product.price}
        ${product.description || ''}
        View: ${product.link}?utm_source=email&utm_medium=weekly&utm_campaign=new_arrivals
      `).join('')}
      ` : ''}
      
      ${featuredProducts.length > 0 ? `
      🏆 FEATURED PRODUCTS:
      ${featuredProducts.slice(0, 3).map(product => `
      - ${product.name} - $${product.price}
        ${product.description || ''}
        Shop: ${product.link}?utm_source=email&utm_medium=weekly&utm_campaign=featured_products
      `).join('')}
      ` : ''}
      
      ${designTips.length > 0 ? `
      💡 THIS WEEK'S DESIGN TIPS:
      ${designTips.map((tip, index) => `
      ${index + 1}. ${tip.title}
         ${tip.content}
         ${tip.link ? `Read more: ${tip.link}?utm_source=email&utm_medium=weekly&utm_campaign=design_tips` : ''}
      `).join('')}
      ` : ''}
      
      ${blogPosts.length > 0 ? `
      📚 LATEST FROM OUR BLOG:
      ${blogPosts.map(post => `
      - ${post.title}
        ${post.excerpt}
        Read: ${post.link}?utm_source=email&utm_medium=weekly&utm_campaign=blog_posts
      `).join('')}
      ` : ''}
      
      ⭐ CUSTOMER SPOTLIGHT:
      "This week I received my new dining set from ElanorraLiving and I'm absolutely in love! The craftsmanship is exceptional and it's transformed our dining room into a luxury space." - Jennifer K.
      
      Share your story: ${process.env.NEXTAUTH_URL}/reviews?utm_source=email&utm_medium=weekly&utm_campaign=customer_spotlight
      
      QUICK SHOP BY CATEGORY:
      Living Room: ${process.env.NEXTAUTH_URL}/categories/living-room?utm_source=email&utm_medium=weekly&utm_campaign=quick_shop
      Bedroom: ${process.env.NEXTAUTH_URL}/categories/bedroom?utm_source=email&utm_medium=weekly&utm_campaign=quick_shop
      Dining: ${process.env.NEXTAUTH_URL}/categories/dining?utm_source=email&utm_medium=weekly&utm_campaign=quick_shop
      Décor: ${process.env.NEXTAUTH_URL}/categories/decor?utm_source=email&utm_medium=weekly&utm_campaign=quick_shop
      
      Follow us for daily inspiration:
      Facebook: ${process.env.NEXTAUTH_URL}/social/facebook?utm_source=email&utm_medium=weekly&utm_campaign=social
      Instagram: ${process.env.NEXTAUTH_URL}/social/instagram?utm_source=email&utm_medium=weekly&utm_campaign=social
      Pinterest: ${process.env.NEXTAUTH_URL}/social/pinterest?utm_source=email&utm_medium=weekly&utm_campaign=social
      YouTube: ${process.env.NEXTAUTH_URL}/social/youtube?utm_source=email&utm_medium=weekly&utm_campaign=social
      
      ---
      You're receiving this weekly newsletter because you subscribed to ElanorraLiving updates.
      Unsubscribe: ${unsubscribeUrl}
      Update Preferences: ${process.env.NEXTAUTH_URL}/newsletter/preferences?email=${encodeURIComponent(email)}
      
      © 2024 ElanorraLiving. All rights reserved.
      ElanorraLiving - Premium Home Furniture & Décor
      Transforming houses into luxury homes since 2024
      For support, visit: ${process.env.NEXTAUTH_URL}/contact
    `;

    return this.sendEmail({
      to: email,
      subject: `🏡 ElanorraLiving Weekly #${weekNumber} - New Arrivals, Design Tips & Exclusive Offers Inside!`,
      html,
      text,
    });
  }

  private initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    } catch (error) {
      console.error('Failed to initialize email transporter:', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email transporter not initialized');
      return false;
    }

    try {
      const mailOptions: any = {
        from: `"Elanorra Living" <info@elanorraliving.in>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      // Add attachments if provided
      if (options.attachments && options.attachments.length > 0) {
        mailOptions.attachments = options.attachments;
      }

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<boolean> {
    const { email, firstName, resetToken, resetUrl } = data;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - Elanorra</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); min-height: 100vh;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); border-radius: 16px; overflow: hidden;">
          
          <!-- Header with gradient background -->
          <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 40px 30px; text-align: center; position: relative;">
            <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 12px; padding: 20px; display: inline-block;">
              <div style="display: inline-block; background: rgba(255, 255, 255, 0.95); border-radius: 12px; padding: 12px; margin-bottom: 16px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" style="display: block;">
                  <defs>
                    <linearGradient id="reset-logo-gradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stop-color="#dc2626"/>
                      <stop offset="100%" stop-color="#ef4444"/>
                    </linearGradient>
                  </defs>
                  <rect x="0" y="0" width="48" height="48" rx="12" fill="url(#reset-logo-gradient)"/>
                  <path d="M12 36c0-9.941 8.059-18 18-18h6v6h-6c-6.627 0-12 5.373-12 12v6h-6v-6z" fill="#ffffff" opacity="0.95"/>
                  <rect x="12" y="12" width="18" height="3.75" fill="#ffffff" opacity="0.95"/>
                  <rect x="12" y="22.125" width="12" height="3.75" fill="#ffffff" opacity="0.95"/>
                </svg>
              </div>
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); letter-spacing: -0.5px;">
                Elanorra
              </h1>
              <p style="color: rgba(255, 255, 255, 0.9); font-size: 14px; margin: 8px 0 0 0; font-weight: 500;">
                Password Reset Request
              </p>
            </div>
          </div>

          <!-- Main content -->
          <div style="padding: 50px 40px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h2 style="color: #1e293b; font-size: 32px; font-weight: 700; margin: 0 0 16px 0; line-height: 1.2;">
                Reset Your Password
              </h2>
              <div style="width: 60px; height: 4px; background: linear-gradient(90deg, #dc2626, #ef4444); margin: 0 auto; border-radius: 2px;"></div>
            </div>

            <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 16px; padding: 30px; margin-bottom: 30px; border: 1px solid #e2e8f0;">
              <p style="color: #475569; font-size: 18px; line-height: 1.6; margin: 0 0 20px 0;">
                Hello <strong style="color: #1e293b;">${firstName || 'there'}</strong>,
              </p>
              <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0;">
                We received a request to reset the password for your account associated with <strong>${email}</strong>. If you made this request, click the button below to create a new password.
              </p>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 40px 0;">
              <a href="${resetUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: #ffffff; padding: 18px 36px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 20px rgba(220, 38, 38, 0.3); transition: all 0.3s ease; letter-spacing: 0.5px;">
                🔒 Reset Password
              </a>
            </div>

            <!-- Alternative link -->
            <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 30px 0; border-left: 4px solid #dc2626;">
              <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">
                Can't click the button? Copy and paste this link:
              </p>
              <p style="word-break: break-all; color: #dc2626; font-size: 13px; margin: 0; font-family: 'Courier New', monospace; background: #ffffff; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
                ${resetUrl}
              </p>
            </div>

            <!-- Security notice -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 20px; margin: 30px 0; border: 1px solid #f59e0b;">
              <p style="color: #92400e; font-size: 14px; margin: 0 0 10px 0; display: flex; align-items: center;">
                <span style="margin-right: 8px; font-size: 16px;">⚠️</span>
                <strong>Important Security Information:</strong>
              </p>
              <ul style="color: #92400e; font-size: 14px; margin: 10px 0 0 0; padding-left: 20px;">
                <li>This link will expire in 1 hour for security reasons</li>
                <li>If you didn't request this password reset, please ignore this email</li>
                <li>Your password will remain unchanged until you create a new one</li>
              </ul>
            </div>

            <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 30px 0 0 0; text-align: center;">
              If you're having trouble clicking the button, copy and paste the URL above into your web browser.
            </p>
          </div>

          <!-- Footer -->
          <div style="background: #1e293b; padding: 30px 40px; text-align: center;">
            <div style="margin-bottom: 20px;">
              <div style="display: inline-block; background: rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 8px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style="display: block;">
                  <defs>
                    <linearGradient id="reset-footer-logo-gradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stop-color="#dc2626"/>
                      <stop offset="100%" stop-color="#ef4444"/>
                    </linearGradient>
                  </defs>
                  <rect x="0" y="0" width="24" height="24" rx="6" fill="url(#reset-footer-logo-gradient)"/>
                  <path d="M6 18c0-4.971 4.029-9 9-9h3v3h-3c-3.314 0-6 2.686-6 6v3H6v-3z" fill="#ffffff" opacity="0.95"/>
                  <rect x="6" y="6" width="9" height="1.875" fill="#ffffff" opacity="0.95"/>
                  <rect x="6" y="11.063" width="6" height="1.875" fill="#ffffff" opacity="0.95"/>
                </svg>
              </div>
            </div>
            <p style="color: #94a3b8; font-size: 12px; margin: 0 0 10px 0; font-weight: 500;">
              © 2024 Elanorra Living. All rights reserved.
            </p>
            <p style="color: #64748b; font-size: 11px; margin: 0; line-height: 1.4;">
              This email was sent from Elanorra. Please do not reply to this email.<br>
              For support, visit our website or contact our customer service team.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Password Reset Request
      
      Hello ${firstName || 'there'},
      
      We received a request to reset the password for your account associated with ${email}.
      
      Click the link below to reset your password:
      ${resetUrl}
      
      Important:
      - This link will expire in 1 hour for security reasons
      - If you didn't request this password reset, please ignore this email
      - Your password will remain unchanged until you create a new one
      
      If you're having trouble with the link, copy and paste it into your web browser.
      
      Best regards,
      The Elanorra Team
      
      This is an automated message, please do not reply to this email.
    `;

    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password - Elanorra',
      html,
      text,
    });
  }

  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    const { email, firstName, verificationUrl } = data;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Elanorra - Your Journey Begins</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); min-height: 100vh;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); border-radius: 16px; overflow: hidden;">
          
          <!-- Header with gradient background -->
          <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 40px 30px; text-align: center; position: relative;">
            <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 12px; padding: 20px; display: inline-block;">
              <div style="display: inline-block; background: rgba(255, 255, 255, 0.95); border-radius: 12px; padding: 12px; margin-bottom: 16px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" style="display: block;">
                  <defs>
                    <linearGradient id="welcome-logo-gradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stop-color="#059669"/>
                      <stop offset="100%" stop-color="#10b981"/>
                    </linearGradient>
                  </defs>
                  <rect x="0" y="0" width="48" height="48" rx="12" fill="url(#welcome-logo-gradient)"/>
                  <path d="M12 36c0-9.941 8.059-18 18-18h6v6h-6c-6.627 0-12 5.373-12 12v6h-6v-6z" fill="#ffffff" opacity="0.95"/>
                  <rect x="12" y="12" width="18" height="3.75" fill="#ffffff" opacity="0.95"/>
                  <rect x="12" y="22.125" width="12" height="3.75" fill="#ffffff" opacity="0.95"/>
                </svg>
              </div>
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); letter-spacing: -0.5px;">
                Elanorra
              </h1>
              <p style="color: rgba(255, 255, 255, 0.9); font-size: 14px; margin: 8px 0 0 0; font-weight: 500;">
                Welcome to Premium Living
              </p>
            </div>
          </div>

          <!-- Main content -->
          <div style="padding: 50px 40px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h2 style="color: #1e293b; font-size: 32px; font-weight: 700; margin: 0 0 16px 0; line-height: 1.2;">
                Welcome to Elanorra! 🎉
              </h2>
              <div style="width: 60px; height: 4px; background: linear-gradient(90deg, #059669, #10b981); margin: 0 auto; border-radius: 2px;"></div>
            </div>

            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border-radius: 16px; padding: 30px; margin-bottom: 30px; border: 1px solid #bbf7d0;">
              <p style="color: #475569; font-size: 18px; line-height: 1.6; margin: 0 0 20px 0;">
                Hello <strong style="color: #1e293b;">${firstName || 'there'}</strong>,
              </p>
              <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0;">
                Thank you for joining Elanorra! We're thrilled to have you as part of our community. Your account has been successfully created and you're ready to explore our premium collection.
              </p>
            </div>

            ${verificationUrl ? `
            <!-- Verification CTA -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 16px; padding: 30px; margin: 30px 0; border: 1px solid #f59e0b; text-align: center;">
              <h3 style="color: #92400e; font-size: 20px; font-weight: 600; margin: 0 0 15px 0;">
                🔐 One More Step to Complete
              </h3>
              <p style="color: #92400e; font-size: 14px; margin: 0 0 20px 0;">
                Please verify your email address to unlock all features and start shopping.
              </p>
              <a href="${verificationUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px; box-shadow: 0 6px 16px rgba(245, 158, 11, 0.3);">
                ✅ Verify Email Address
              </a>
              
              <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">
                  Can't click the button? Copy and paste this link:
                </p>
                <p style="word-break: break-all; color: #f59e0b; font-size: 13px; margin: 0; font-family: 'Courier New', monospace; background: #ffffff; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
                  ${verificationUrl}
                </p>
              </div>
            </div>
            ` : `
            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border-radius: 16px; padding: 30px; margin: 30px 0; border: 1px solid #bbf7d0; text-align: center;">
              <h3 style="color: #059669; font-size: 20px; font-weight: 600; margin: 0 0 15px 0;">
                🎉 You're All Set!
              </h3>
              <p style="color: #064e3b; font-size: 14px; margin: 0;">
                Your account has been created successfully and you can start shopping right away!
              </p>
            </div>
            `}

            <!-- Benefits section -->
            <div style="margin: 40px 0;">
              <h3 style="color: #1e293b; font-size: 24px; font-weight: 600; margin: 0 0 25px 0; text-align: center;">
                What's Next? Discover Your Benefits
              </h3>
              
              <div style="display: grid; gap: 20px;">
                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
                  <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <span style="font-size: 24px; margin-right: 12px;">🛍️</span>
                    <h4 style="color: #1e293b; font-size: 16px; font-weight: 600; margin: 0;">Premium Shopping Experience</h4>
                  </div>
                  <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.5;">
                    Browse our curated collection of premium furniture and save items to your wishlist.
                  </p>
                </div>

                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
                  <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <span style="font-size: 24px; margin-right: 12px;">🚚</span>
                    <h4 style="color: #1e293b; font-size: 16px; font-weight: 600; margin: 0;">Fast & Free Shipping</h4>
                  </div>
                  <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.5;">
                    Track your orders and delivery status with our premium shipping service.
                  </p>
                </div>

                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
                  <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <span style="font-size: 24px; margin-right: 12px;">💎</span>
                    <h4 style="color: #1e293b; font-size: 16px; font-weight: 600; margin: 0;">Member Benefits</h4>
                  </div>
                  <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.5;">
                    Manage your addresses, payment methods, and leave reviews and ratings.
                  </p>
                </div>

                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
                  <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <span style="font-size: 24px; margin-right: 12px;">🎯</span>
                    <h4 style="color: #1e293b; font-size: 16px; font-weight: 600; margin: 0;">24/7 Customer Support</h4>
                  </div>
                  <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.5;">
                    Our dedicated support team is always here to help with any questions or concerns.
                  </p>
                </div>
              </div>
            </div>

            <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 30px 0 0 0; text-align: center;">
              Happy shopping! If you have any questions, our customer support team is here to help.
            </p>
          </div>

          <!-- Footer -->
          <div style="background: #1e293b; padding: 30px 40px; text-align: center;">
            <div style="margin-bottom: 20px;">
              <div style="display: inline-block; background: rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 8px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style="display: block;">
                  <defs>
                    <linearGradient id="welcome-footer-logo-gradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stop-color="#059669"/>
                      <stop offset="100%" stop-color="#10b981"/>
                    </linearGradient>
                  </defs>
                  <rect x="0" y="0" width="24" height="24" rx="6" fill="url(#welcome-footer-logo-gradient)"/>
                  <path d="M6 18c0-4.971 4.029-9 9-9h3v3h-3c-3.314 0-6 2.686-6 6v3H6v-3z" fill="#ffffff" opacity="0.95"/>
                  <rect x="6" y="6" width="9" height="1.875" fill="#ffffff" opacity="0.95"/>
                  <rect x="6" y="11.063" width="6" height="1.875" fill="#ffffff" opacity="0.95"/>
                </svg>
              </div>
            </div>
            <p style="color: #94a3b8; font-size: 12px; margin: 0 0 10px 0; font-weight: 500;">
              © 2024 Elanorra Living. All rights reserved.
            </p>
            <p style="color: #64748b; font-size: 11px; margin: 0; line-height: 1.4;">
              This email was sent from Elanorra. Please do not reply to this email.<br>
              For support, visit our website or contact our customer service team.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Welcome to Elanorra!
      
      Hello ${firstName || 'there'},
      
      Welcome to Elanorra! We're excited to have you join our community.
      
      ${verificationUrl ? `
        To get started, please verify your email address by visiting:
        ${verificationUrl}
      ` : `
        Your account has been created successfully and you can start shopping right away!
      `}
      
      Here's what you can do with your new account:
      - Browse our curated collection of premium furniture
      - Save items to your wishlist
      - Track your orders and delivery status
      - Manage your addresses and payment methods
      - Leave reviews and ratings
      
      If you have any questions, our customer support team is here to help.
      
      Happy shopping!
      The Elanorra Team
      
      This is an automated message, please do not reply to this email.
    `;

    return this.sendEmail({
      to: email,
      subject: 'Welcome to Elanorra - Your Account is Ready!',
      html,
      text,
    });
  }

  async sendOrderConfirmationEmail(orderData: OrderConfirmationEmailData): Promise<boolean> {
    try {
      const customerName = orderData.customerName || 
        `${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName}`;
      
      const orderDate = new Date(orderData.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: orderData.currency || 'INR'
        }).format(amount);
      };

      const formatAddress = (address: any) => {
        const parts = [
          address.firstName + ' ' + address.lastName,
          address.company,
          address.address1,
          address.address2,
          `${address.city}, ${address.state} ${address.zipCode}`,
          address.country,
          address.phone
        ].filter(Boolean);
        return parts.join('<br>');
      };

      const itemsHtml = orderData.items.map(item => {
        const variantsText = item.variants && Object.keys(item.variants).length > 0
          ? `<br><small style="color: #666;">${Object.entries(item.variants)
              .map(([key, value]) => `${key}: ${value}`)
              .join(', ')}</small>`
          : '';
        
        return `
          <tr>
            <td style="padding: 15px; border-bottom: 1px solid #eee;">
              <div style="display: flex; align-items: center;">
                ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; margin-right: 15px; border-radius: 8px;">` : ''}
                <div>
                  <strong>${item.name}</strong>
                  ${variantsText}
                </div>
              </div>
            </td>
            <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: center;">
              ${item.quantity}
            </td>
            <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: right;">
              ${formatCurrency(item.price)}
            </td>
          </tr>
        `;
      }).join('');

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation - ${orderData.orderNumber}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #e11d48 0%, #be185d 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
                Order Confirmed!
              </h1>
              <p style="color: #fecaca; margin: 10px 0 0 0; font-size: 16px;">
                Thank you for your purchase, ${customerName}
              </p>
            </div>

            <!-- Order Details -->
            <div style="padding: 30px;">
              <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <h2 style="margin: 0 0 15px 0; color: #1e293b; font-size: 20px;">Order Details</h2>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                  <div>
                    <strong style="color: #475569;">Order Number:</strong><br>
                    <span style="color: #e11d48; font-weight: 600;">${orderData.orderNumber}</span>
                  </div>
                  <div>
                    <strong style="color: #475569;">Order Date:</strong><br>
                    ${orderDate}
                  </div>
                  <div>
                    <strong style="color: #475569;">Payment Method:</strong><br>
                    ${orderData.paymentMethod || 'Online Payment'}
                  </div>
                  <div>
                    <strong style="color: #475569;">Total Amount:</strong><br>
                    <span style="color: #059669; font-weight: 600; font-size: 18px;">${formatCurrency(orderData.totalPrice)}</span>
                  </div>
                </div>
              </div>

              <!-- Items -->
              <h3 style="color: #1e293b; margin-bottom: 20px;">Items Ordered</h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f8fafc;">
                    <th style="padding: 15px; text-align: left; color: #475569; font-weight: 600;">Product</th>
                    <th style="padding: 15px; text-align: center; color: #475569; font-weight: 600;">Quantity</th>
                    <th style="padding: 15px; text-align: right; color: #475569; font-weight: 600;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Order Summary -->
              <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <h3 style="margin: 0 0 15px 0; color: #1e293b;">Order Summary</h3>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span>Subtotal:</span>
                  <span>${formatCurrency(orderData.subtotal)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span>Shipping:</span>
                  <span>${formatCurrency(orderData.shipping)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span>Taxes:</span>
                  <span>${formatCurrency(orderData.taxes)}</span>
                </div>
                ${orderData.discount && orderData.discount > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #059669;">
                  <span>Discount:</span>
                  <span>-${formatCurrency(orderData.discount)}</span>
                </div>
                ` : ''}
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 15px 0;">
                <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 18px; color: #1e293b;">
                  <span>Total:</span>
                  <span style="color: #059669;">${formatCurrency(orderData.totalPrice)}</span>
                </div>
              </div>

              <!-- Shipping Address -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                <div>
                  <h3 style="color: #1e293b; margin-bottom: 15px;">Shipping Address</h3>
                  <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; line-height: 1.6;">
                    ${formatAddress(orderData.shippingAddress)}
                  </div>
                </div>
                <div>
                  <h3 style="color: #1e293b; margin-bottom: 15px;">Billing Address</h3>
                  <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; line-height: 1.6;">
                    ${formatAddress(orderData.billingAddress || orderData.shippingAddress)}
                  </div>
                </div>
              </div>

              <!-- Track Order Button -->
              <div style="text-align: center; margin-bottom: 30px;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/order-confirmation/${orderData.orderId}" 
                   style="display: inline-block; background: linear-gradient(135deg, #e11d48 0%, #be185d 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Track Your Order
                </a>
              </div>

              <!-- What's Next -->
              <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                <h3 style="color: #1e40af; margin: 0 0 10px 0;">What's Next?</h3>
                <ul style="color: #1e40af; margin: 0; padding-left: 20px;">
                  <li>We'll send you a shipping confirmation email with tracking details once your order ships</li>
                  <li>You can track your order status anytime using the link above</li>
                  <li>Expected delivery: 3-7 business days</li>
                </ul>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #1f2937; padding: 30px; text-align: center;">
              <h3 style="color: #ffffff; margin: 0 0 15px 0;">Elanorra</h3>
              <p style="color: #9ca3af; margin: 0 0 15px 0; font-size: 14px;">
                Premium Home Decor & Lifestyle Products
              </p>
              <p style="color: #6b7280; margin: 0; font-size: 12px;">
                If you have any questions, please contact us at 
                <a href="mailto:support@elanorra.com" style="color: #e11d48;">support@elanorra.com</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      const textContent = `
Order Confirmation - ${orderData.orderNumber}

Dear ${customerName},

Thank you for your order! We're excited to confirm that we've received your order and it's being processed.

Order Details:
- Order Number: ${orderData.orderNumber}
- Order Date: ${orderDate}
- Total Amount: ${formatCurrency(orderData.totalPrice)}

Items Ordered:
${orderData.items.map(item => `- ${item.name} (Qty: ${item.quantity}) - ${formatCurrency(item.price)}`).join('\n')}

Shipping Address:
${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName}
${orderData.shippingAddress.address1}
${orderData.shippingAddress.address2 ? orderData.shippingAddress.address2 + '\n' : ''}${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} ${orderData.shippingAddress.zipCode}
${orderData.shippingAddress.country}

Track your order: ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/order-confirmation/${orderData.orderId}

We'll send you a shipping confirmation email with tracking details once your order ships.

Thank you for choosing Elanorra!

Best regards,
The Elanorra Team
      `;

      return await this.sendEmail({
        to: orderData.email,
        subject: `Order Confirmation - ${orderData.orderNumber}`,
        html: htmlContent,
        text: textContent
      });
    } catch (error) {
      console.error('Failed to send order confirmation email:', error);
      return false;
    }
  }

  async sendShippingNotificationEmail(orderData: ShippingNotificationEmailData): Promise<boolean> {
    try {
      const customerName = orderData.customerName || 
        `${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName}`;

      const formatAddress = (address: any) => {
        const parts = [
          address.firstName + ' ' + address.lastName,
          address.company,
          address.address1,
          address.address2,
          `${address.city}, ${address.state} ${address.zipCode}`,
          address.country,
          address.phone
        ].filter(Boolean);
        return parts.join('<br>');
      };

      const itemsHtml = orderData.items.map(item => `
        <tr>
          <td style="padding: 15px; border-bottom: 1px solid #eee;">
            <div style="display: flex; align-items: center;">
              ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; margin-right: 15px; border-radius: 6px;">` : ''}
              <div>
                <strong>${item.name}</strong>
              </div>
            </div>
          </td>
          <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: center;">
            ${item.quantity}
          </td>
        </tr>
      `).join('');

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Order Has Shipped - ${orderData.orderNumber}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
                📦 Your Order Has Shipped!
              </h1>
              <p style="color: #a7f3d0; margin: 10px 0 0 0; font-size: 16px;">
                Great news, ${customerName}! Your order is on its way.
              </p>
            </div>

            <!-- Shipping Details -->
            <div style="padding: 30px;">
              <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #059669;">
                <h2 style="margin: 0 0 15px 0; color: #1e293b; font-size: 20px;">Shipping Information</h2>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                  <div>
                    <strong style="color: #475569;">Order Number:</strong><br>
                    <span style="color: #e11d48; font-weight: 600;">${orderData.orderNumber}</span>
                  </div>
                  ${orderData.trackingNumber ? `
                  <div>
                    <strong style="color: #475569;">Tracking Number:</strong><br>
                    <span style="color: #059669; font-weight: 600;">${orderData.trackingNumber}</span>
                  </div>
                  ` : ''}
                  ${orderData.carrier ? `
                  <div>
                    <strong style="color: #475569;">Carrier:</strong><br>
                    ${orderData.carrier}
                  </div>
                  ` : ''}
                  ${orderData.estimatedDelivery ? `
                  <div>
                    <strong style="color: #475569;">Estimated Delivery:</strong><br>
                    <span style="color: #059669; font-weight: 600;">${orderData.estimatedDelivery}</span>
                  </div>
                  ` : ''}
                </div>
              </div>

              <!-- Items Shipped -->
              <h3 style="color: #1e293b; margin-bottom: 20px;">Items Shipped</h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f8fafc;">
                    <th style="padding: 15px; text-align: left; color: #475569; font-weight: 600;">Product</th>
                    <th style="padding: 15px; text-align: center; color: #475569; font-weight: 600;">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Shipping Address -->
              <div style="margin-bottom: 30px;">
                <h3 style="color: #1e293b; margin-bottom: 15px;">Shipping To</h3>
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; line-height: 1.6;">
                  ${formatAddress(orderData.shippingAddress)}
                </div>
              </div>

              <!-- Track Package Button -->
              ${orderData.trackingNumber ? `
              <div style="text-align: center; margin-bottom: 30px;">
                <a href="${this.getTrackingUrl(orderData.carrier, orderData.trackingNumber)}" 
                   style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Track Your Package
                </a>
              </div>
              ` : ''}

              <!-- Delivery Information -->
              <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                <h3 style="color: #1e40af; margin: 0 0 10px 0;">Delivery Information</h3>
                <ul style="color: #1e40af; margin: 0; padding-left: 20px;">
                  <li>Your package is on its way and will be delivered to the address above</li>
                  ${orderData.estimatedDelivery ? `<li>Expected delivery: ${orderData.estimatedDelivery}</li>` : '<li>Expected delivery: 3-7 business days</li>'}
                  ${orderData.trackingNumber ? '<li>You can track your package using the tracking number above</li>' : ''}
                  <li>Someone should be available to receive the package</li>
                  <li>If you're not available, the carrier may leave a delivery notice</li>
                </ul>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #1f2937; padding: 30px; text-align: center;">
              <h3 style="color: #ffffff; margin: 0 0 15px 0;">Elanorra</h3>
              <p style="color: #9ca3af; margin: 0 0 15px 0; font-size: 14px;">
                Premium Home Decor & Lifestyle Products
              </p>
              <p style="color: #6b7280; margin: 0; font-size: 12px;">
                If you have any questions about your shipment, please contact us at 
                <a href="mailto:support@elanorra.com" style="color: #e11d48;">support@elanorra.com</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      const textContent = `
Your Order Has Shipped - ${orderData.orderNumber}

Dear ${customerName},

Great news! Your order has been shipped and is on its way to you.

Shipping Information:
- Order Number: ${orderData.orderNumber}
${orderData.trackingNumber ? `- Tracking Number: ${orderData.trackingNumber}` : ''}
${orderData.carrier ? `- Carrier: ${orderData.carrier}` : ''}
${orderData.estimatedDelivery ? `- Estimated Delivery: ${orderData.estimatedDelivery}` : '- Expected delivery: 3-7 business days'}

Items Shipped:
${orderData.items.map(item => `- ${item.name} (Qty: ${item.quantity})`).join('\n')}

Shipping Address:
${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName}
${orderData.shippingAddress.address1}
${orderData.shippingAddress.address2 ? orderData.shippingAddress.address2 + '\n' : ''}${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} ${orderData.shippingAddress.zipCode}
${orderData.shippingAddress.country}

${orderData.trackingNumber ? `Track your package: ${this.getTrackingUrl(orderData.carrier, orderData.trackingNumber)}` : ''}

Thank you for choosing Elanorra!

Best regards,
The Elanorra Team
      `;

      return await this.sendEmail({
        to: orderData.email,
        subject: `Your Order Has Shipped - ${orderData.orderNumber}`,
        html: htmlContent,
        text: textContent
      });
    } catch (error) {
      console.error('Failed to send shipping notification email:', error);
      return false;
    }
  }

  private getTrackingUrl(carrier?: string, trackingNumber?: string): string {
    if (!trackingNumber) return '#';
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Return a generic tracking page or carrier-specific URLs
    switch (carrier?.toLowerCase()) {
      case 'fedex':
        return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
      case 'ups':
        return `https://www.ups.com/track?tracknum=${trackingNumber}`;
      case 'dhl':
        return `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`;
      case 'bluedart':
        return `https://www.bluedart.com/web/guest/trackdartresult?trackFor=0&trackNo=${trackingNumber}`;
      case 'dtdc':
        return `https://www.dtdc.in/tracking/tracking_results.asp?Ttype=awb_no&strTrkNo=${trackingNumber}`;
      default:
        // Return a generic orders page when carrier-specific is unavailable
        return `${baseUrl}/account/orders`;
    }
  }

  async sendNewsletterWelcomeEmail(data: NewsletterWelcomeData): Promise<boolean> {
    const { email, firstName, lastName, unsubscribeUrl } = data;
    const displayName = firstName ? (lastName ? `${firstName} ${lastName}` : firstName) : '';

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ElanorraLiving Community - Your Journey to Luxury Living Begins!</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); min-height: 100vh;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); border-radius: 16px; overflow: hidden;">
          
          <!-- Header with gradient background -->
          <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 40px 30px; text-align: center; position: relative;">
            <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 12px; padding: 20px; display: inline-block;">
              <div style="display: inline-block; background: rgba(255, 255, 255, 0.95); border-radius: 12px; padding: 12px; margin-bottom: 16px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" style="display: block;">
                  <defs>
                    <linearGradient id="newsletter-logo-gradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" style="stop-color:#dc2626"/>
                      <stop offset="100%" style="stop-color:#ef4444"/>
                    </linearGradient>
                  </defs>
                  <path d="M24 4L6 14v20c0 11.05 7.95 20 18 20s18-8.95 18-20V14L24 4z" fill="url(#newsletter-logo-gradient)"/>
                  <path d="M24 16l-8 6v12h16V22l-8-6z" fill="white" opacity="0.9"/>
                </svg>
              </div>
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                Welcome to ElanorraLiving Community!
              </h1>
              <p style="color: rgba(255, 255, 255, 0.9); font-size: 16px; margin: 8px 0 0 0; font-weight: 500;">
                ${displayName ? `Hello ${displayName}! ` : ''}Your journey to luxury living begins now
              </p>
            </div>
          </div>

          <!-- Main content -->
          <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #1e293b; font-size: 24px; font-weight: 600; margin: 0 0 15px 0;">
                🎉 Welcome to the Community!
              </h2>
              <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0;">
                Thank you for joining the ElanorraLiving Community! You're now part of an exclusive group that receives premium home décor insights, luxury furniture updates, and insider access to the latest trends in elegant living.
              </p>
            </div>

            <!-- Special Welcome Offer -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 16px; padding: 25px; margin: 30px 0; border: 2px solid #f59e0b; text-align: center;">
              <h3 style="color: #92400e; font-size: 20px; font-weight: 700; margin: 0 0 10px 0;">
                🎁 Exclusive Welcome Offer - 15% OFF
              </h3>
              <p style="color: #78350f; font-size: 16px; margin: 0 0 15px 0; font-weight: 500;">
                Use code <strong>WELCOME15</strong> on your first purchase
              </p>
              <a href="${process.env.NEXTAUTH_URL}/shop?utm_source=email&utm_medium=welcome&utm_campaign=new_subscriber" 
                 style="display: inline-block; background: #f59e0b; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                Shop Now & Save 15%
              </a>
            </div>

            <!-- What to expect section -->
            <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 16px; padding: 30px; margin: 30px 0; border: 1px solid #e2e8f0;">
              <h3 style="color: #1e293b; font-size: 20px; font-weight: 600; margin: 0 0 20px 0; text-align: center;">
                Your Weekly Luxury Living Updates
              </h3>
              
              <div style="display: grid; gap: 15px;">
                <div style="display: flex; align-items: flex-start;">
                  <span style="font-size: 20px; margin-right: 12px; margin-top: 2px;">🎁</span>
                  <div>
                    <h4 style="color: #1e293b; font-size: 16px; font-weight: 600; margin: 0 0 5px 0;">Exclusive Offers & Flash Sales</h4>
                    <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.5;">
                      Be the first to access special discounts, early bird sales, member-only promotions, and limited-time flash deals on premium furniture.
                    </p>
                  </div>
                </div>

                <div style="display: flex; align-items: flex-start;">
                  <span style="font-size: 20px; margin-right: 12px; margin-top: 2px;">✨</span>
                  <div>
                    <h4 style="color: #1e293b; font-size: 16px; font-weight: 600; margin: 0 0 5px 0;">Design Inspiration & Trends</h4>
                    <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.5;">
                      Get curated home décor ideas, styling tips, seasonal trends, and interior design insights from our expert team and industry professionals.
                    </p>
                  </div>
                </div>

                <div style="display: flex; align-items: flex-start;">
                  <span style="font-size: 20px; margin-right: 12px; margin-top: 2px;">🏡</span>
                  <div>
                    <h4 style="color: #1e293b; font-size: 16px; font-weight: 600; margin: 0 0 5px 0;">New Product Launches</h4>
                    <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.5;">
                      Discover the latest in premium furniture, luxury décor, and lifestyle products before they're available to the general public.
                    </p>
                  </div>
                </div>

                <div style="display: flex; align-items: flex-start;">
                  <span style="font-size: 20px; margin-right: 12px; margin-top: 2px;">📚</span>
                  <div>
                    <h4 style="color: #1e293b; font-size: 16px; font-weight: 600; margin: 0 0 5px 0;">Home Styling Guides & Tips</h4>
                    <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.5;">
                      Weekly how-to guides, room makeover ideas, color palette suggestions, and expert advice to transform your living space.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Featured Categories -->
            <div style="margin: 30px 0;">
              <h3 style="color: #1e293b; font-size: 18px; font-weight: 600; margin: 0 0 20px 0; text-align: center;">
                Explore Our Premium Collections
              </h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <a href="${process.env.NEXTAUTH_URL}/categories/living-room?utm_source=email&utm_medium=welcome&utm_campaign=category_living" 
                   style="display: block; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-decoration: none; text-align: center; transition: all 0.3s ease;">
                  <div style="font-size: 24px; margin-bottom: 8px;">🛋️</div>
                  <h4 style="color: #1e293b; font-size: 14px; font-weight: 600; margin: 0;">Living Room</h4>
                </a>
                <a href="${process.env.NEXTAUTH_URL}/categories/bedroom?utm_source=email&utm_medium=welcome&utm_campaign=category_bedroom" 
                   style="display: block; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-decoration: none; text-align: center; transition: all 0.3s ease;">
                  <div style="font-size: 24px; margin-bottom: 8px;">🛏️</div>
                  <h4 style="color: #1e293b; font-size: 14px; font-weight: 600; margin: 0;">Bedroom</h4>
                </a>
                <a href="${process.env.NEXTAUTH_URL}/categories/dining?utm_source=email&utm_medium=welcome&utm_campaign=category_dining" 
                   style="display: block; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-decoration: none; text-align: center; transition: all 0.3s ease;">
                  <div style="font-size: 24px; margin-bottom: 8px;">🍽️</div>
                  <h4 style="color: #1e293b; font-size: 14px; font-weight: 600; margin: 0;">Dining</h4>
                </a>
                <a href="${process.env.NEXTAUTH_URL}/categories/decor?utm_source=email&utm_medium=welcome&utm_campaign=category_decor" 
                   style="display: block; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-decoration: none; text-align: center; transition: all 0.3s ease;">
                  <div style="font-size: 24px; margin-bottom: 8px;">🎨</div>
                  <h4 style="color: #1e293b; font-size: 14px; font-weight: 600; margin: 0;">Décor</h4>
                </a>
              </div>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 40px 0;">
              <a href="${process.env.NEXTAUTH_URL}/shop?utm_source=email&utm_medium=welcome&utm_campaign=main_cta" 
                 style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 20px rgba(220, 38, 38, 0.3); transition: all 0.3s ease;">
                🛍️ Explore Our Luxury Collection
              </a>
            </div>

            <!-- Social Media -->
            <div style="text-align: center; margin: 30px 0;">
              <h4 style="color: #1e293b; font-size: 16px; font-weight: 600; margin: 0 0 15px 0;">
                Follow Us for Daily Inspiration & Behind-the-Scenes Content
              </h4>
              <div style="display: inline-flex; gap: 15px;">
                <a href="${process.env.NEXTAUTH_URL}/social/facebook?utm_source=email&utm_medium=welcome&utm_campaign=social" style="display: inline-block; width: 40px; height: 40px; background: #1877f2; border-radius: 50%; text-decoration: none; color: white; text-align: center; line-height: 40px; font-size: 18px;">📘</a>
                <a href="${process.env.NEXTAUTH_URL}/social/instagram?utm_source=email&utm_medium=welcome&utm_campaign=social" style="display: inline-block; width: 40px; height: 40px; background: #e4405f; border-radius: 50%; text-decoration: none; color: white; text-align: center; line-height: 40px; font-size: 18px;">📷</a>
                <a href="${process.env.NEXTAUTH_URL}/social/pinterest?utm_source=email&utm_medium=welcome&utm_campaign=social" style="display: inline-block; width: 40px; height: 40px; background: #bd081c; border-radius: 50%; text-decoration: none; color: white; text-align: center; line-height: 40px; font-size: 18px;">📌</a>
                <a href="${process.env.NEXTAUTH_URL}/social/youtube?utm_source=email&utm_medium=welcome&utm_campaign=social" style="display: inline-block; width: 40px; height: 40px; background: #ff0000; border-radius: 50%; text-decoration: none; color: white; text-align: center; line-height: 40px; font-size: 18px;">📺</a>
              </div>
            </div>

            <!-- Customer Reviews Teaser -->
            <div style="background: #fef7f0; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #f97316;">
              <h4 style="color: #ea580c; font-size: 16px; font-weight: 600; margin: 0 0 15px 0; text-align: center;">
                ⭐ What Our Community Says
              </h4>
              <p style="color: #9a3412; font-size: 14px; margin: 0; text-align: center; font-style: italic;">
                "ElanorraLiving transformed my home into a luxury sanctuary. The quality and style are unmatched!" - Sarah M.
              </p>
              <div style="text-align: center; margin-top: 15px;">
                <a href="${process.env.NEXTAUTH_URL}/reviews?utm_source=email&utm_medium=welcome&utm_campaign=reviews" 
                   style="color: #ea580c; text-decoration: none; font-weight: 500; font-size: 14px;">
                  Read More Reviews →
                </a>
              </div>
            </div>

            <!-- Unsubscribe notice -->
            <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 30px 0; border-left: 4px solid #dc2626;">
              <p style="color: #64748b; font-size: 14px; margin: 0; text-align: center;">
                You're receiving this because you subscribed to ElanorraLiving updates. 
                <a href="${unsubscribeUrl}" style="color: #dc2626; text-decoration: none;">Unsubscribe</a> | 
                <a href="${process.env.NEXTAUTH_URL}/newsletter/preferences?email=${encodeURIComponent(email)}" style="color: #dc2626; text-decoration: none;">Update Preferences</a>
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0 0 10px 0; font-weight: 500;">
              © 2024 ElanorraLiving. All rights reserved.
            </p>
            <p style="color: #64748b; font-size: 11px; margin: 0; line-height: 1.4;">
              ElanorraLiving - Premium Home Furniture & Décor<br>
              Transforming houses into luxury homes since 2024<br>
              For support, visit our <a href="${process.env.NEXTAUTH_URL}/contact" style="color: #dc2626; text-decoration: none;">contact page</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Welcome to ElanorraLiving Community!
      
      ${displayName ? `Hello ${displayName}! ` : ''}Your journey to luxury living begins now!
      
      🎁 EXCLUSIVE WELCOME OFFER - 15% OFF
      Use code WELCOME15 on your first purchase
      Shop now: ${process.env.NEXTAUTH_URL}/shop?utm_source=email&utm_medium=welcome&utm_campaign=new_subscriber
      
      Your Weekly Luxury Living Updates Include:
      
      🎁 Exclusive Offers & Flash Sales
      Be the first to access special discounts, early bird sales, member-only promotions, and limited-time flash deals on premium furniture.
      
      ✨ Design Inspiration & Trends
      Get curated home décor ideas, styling tips, seasonal trends, and interior design insights from our expert team and industry professionals.
      
      🏡 New Product Launches
      Discover the latest in premium furniture, luxury décor, and lifestyle products before they're available to the general public.
      
      📚 Home Styling Guides & Tips
      Weekly how-to guides, room makeover ideas, color palette suggestions, and expert advice to transform your living space.
      
      Explore Our Premium Collections:
      Living Room: ${process.env.NEXTAUTH_URL}/categories/living-room?utm_source=email&utm_medium=welcome&utm_campaign=category_living
      Bedroom: ${process.env.NEXTAUTH_URL}/categories/bedroom?utm_source=email&utm_medium=welcome&utm_campaign=category_bedroom
      Dining: ${process.env.NEXTAUTH_URL}/categories/dining?utm_source=email&utm_medium=welcome&utm_campaign=category_dining
      Décor: ${process.env.NEXTAUTH_URL}/categories/decor?utm_source=email&utm_medium=welcome&utm_campaign=category_decor
      
      Follow us for daily inspiration:
      Facebook: ${process.env.NEXTAUTH_URL}/social/facebook?utm_source=email&utm_medium=welcome&utm_campaign=social
      Instagram: ${process.env.NEXTAUTH_URL}/social/instagram?utm_source=email&utm_medium=welcome&utm_campaign=social
      Pinterest: ${process.env.NEXTAUTH_URL}/social/pinterest?utm_source=email&utm_medium=welcome&utm_campaign=social
      YouTube: ${process.env.NEXTAUTH_URL}/social/youtube?utm_source=email&utm_medium=welcome&utm_campaign=social
      
      ⭐ What Our Community Says:
      "ElanorraLiving transformed my home into a luxury sanctuary. The quality and style are unmatched!" - Sarah M.
      Read more reviews: ${process.env.NEXTAUTH_URL}/reviews?utm_source=email&utm_medium=welcome&utm_campaign=reviews
      
      ---
      You're receiving this because you subscribed to ElanorraLiving updates.
      Unsubscribe: ${unsubscribeUrl}
      Update Preferences: ${process.env.NEXTAUTH_URL}/newsletter/preferences?email=${encodeURIComponent(email)}
      
      © 2024 ElanorraLiving. All rights reserved.
      ElanorraLiving - Premium Home Furniture & Décor
      Transforming houses into luxury homes since 2024
      For support, visit: ${process.env.NEXTAUTH_URL}/contact
    `;

    return this.sendEmail({
      to: email,
      subject: '🏡 Welcome to ElanorraLiving Community - Your 15% OFF Welcome Gift Inside!',
      html,
      text,
    });
  }

  async sendNewsletterCampaign(
    recipients: string[],
    data: NewsletterCampaignData,
    newsletterId?: string
  ): Promise<{ sent: number; failed: number }> {
    const { subject, htmlContent, textContent, unsubscribeUrl, variables = {} } = data;
    let sent = 0;
    let failed = 0;

    // Process template variables in subject and content
    const processedSubject = replaceTemplateVariables(subject, variables);
    const processedHtmlContent = replaceTemplateVariables(htmlContent, variables);
    const processedTextContent = textContent ? replaceTemplateVariables(textContent, variables) : undefined;

    // Send emails in batches to avoid overwhelming the SMTP server
    const batchSize = 10;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const promises = batch.map(async (email) => {
        try {
          // Add tracking pixel and click tracking to HTML content
          let htmlWithTracking = processedHtmlContent;
          let textWithUnsubscribe = processedTextContent;

          // Add tracking pixel for opens (only if newsletterId is provided)
          if (newsletterId) {
            const trackingPixel = `<img src="${process.env.NEXTAUTH_URL}/api/newsletter/analytics?newsletter=${newsletterId}&subscriber=${encodeURIComponent(email)}" width="1" height="1" style="display:none;" alt="" />`;
            htmlWithTracking = htmlWithTracking.replace('</body>', `${trackingPixel}</body>`);
            
            // If no </body> tag, append at the end
            if (!htmlWithTracking.includes('</body>')) {
              htmlWithTracking += trackingPixel;
            }
          }

          // Add unsubscribe link to HTML content if not already present
          const htmlWithUnsubscribe = htmlWithTracking.includes('{{UNSUBSCRIBE_URL}}') 
            ? htmlWithTracking.replace(/{{UNSUBSCRIBE_URL}}/g, unsubscribeUrl)
            : htmlWithTracking + `
        <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f8fafc; border-radius: 8px;">
          <p style="color: #64748b; font-size: 12px; margin: 0;">
            <a href="${unsubscribeUrl}" style="color: #dc2626; text-decoration: none;">Unsubscribe</a> from these emails
          </p>
        </div>
      `;

          textWithUnsubscribe = textWithUnsubscribe 
            ? (textWithUnsubscribe.includes('{{UNSUBSCRIBE_URL}}') 
                ? textWithUnsubscribe.replace(/{{UNSUBSCRIBE_URL}}/g, unsubscribeUrl)
                : textWithUnsubscribe + `\n\nUnsubscribe: ${unsubscribeUrl}`)
            : undefined;
          
          const success = await this.sendEmail({
            to: email,
            subject: processedSubject,
            html: htmlWithUnsubscribe,
            text: textWithUnsubscribe,
          });
          
          if (success) {
            sent++;
          } else {
            failed++;
          }
        } catch (error) {
          console.error(`Failed to send newsletter to ${email}:`, error);
          failed++;
        }
      });

      await Promise.all(promises);
      
      // Add a small delay between batches
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return { sent, failed };
  }

  async sendAbandonedCartEmail(data: AbandonedCartEmailData): Promise<boolean> {
    const customerName = data.customerName || 'Valued Customer';
    const storeName = process.env.NEXT_PUBLIC_STORE_NAME || 'ElanorraLiving';
    const storeUrl = process.env.NEXTAUTH_URL || 'https://elanorraliving.in';
    
    // Generate cart items HTML
    const cartItemsHtml = data.items.map(item => `
      <tr>
        <td style="padding: 15px; border-bottom: 1px solid #e2e8f0;">
          <div style="display: flex; align-items: center; gap: 15px;">
            ${item.image ? `
              <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0;">
            ` : `
              <div style="width: 60px; height: 60px; background: #f1f5f9; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #64748b; font-size: 12px;">No Image</div>
            `}
            <div style="flex: 1;">
              <h4 style="margin: 0 0 5px 0; color: #1e293b; font-size: 16px; font-weight: 600;">${item.name}</h4>
              <p style="margin: 0; color: #64748b; font-size: 14px;">Quantity: ${item.quantity}</p>
              <p style="margin: 5px 0 0 0; color: #dc2626; font-size: 16px; font-weight: 600;">$${item.price.toFixed(2)}</p>
            </div>
          </div>
        </td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Don't forget your items at ${storeName}!</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); min-height: 100vh;">
        <div style="max-width: 650px; margin: 0 auto; background: #ffffff; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); border-radius: 16px; overflow: hidden;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 30px; text-align: center; position: relative;">
            <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 10px 0; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
              🛒 Don't Forget Your Items!
            </h1>
            <p style="color: #fecaca; font-size: 16px; margin: 0; font-weight: 500;">
              Your cart is waiting for you at ${storeName}
            </p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #1e293b; font-size: 24px; font-weight: 600; margin: 0 0 15px 0;">
                Hi ${customerName}! 👋
              </h2>
              <p style="color: #64748b; font-size: 16px; margin: 0; line-height: 1.6;">
                You left some amazing items in your cart. Don't let them slip away!
              </p>
            </div>

            <!-- Cart Items -->
            <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 30px 0;">
              <h3 style="color: #1e293b; font-size: 20px; font-weight: 600; margin: 0 0 20px 0; text-align: center;">
                Your Cart Items
              </h3>
              <table style="width: 100%; border-collapse: collapse;">
                ${cartItemsHtml}
              </table>
              
              <div style="text-align: right; margin-top: 20px; padding-top: 15px; border-top: 2px solid #dc2626;">
                <p style="color: #1e293b; font-size: 20px; font-weight: 700; margin: 0;">
                  Subtotal: $${data.subtotal.toFixed(2)}
                </p>
              </div>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 40px 0;">
              <a href="${data.cartUrl}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 50px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3); transition: all 0.3s ease;">
                Complete Your Purchase 🛍️
              </a>
            </div>

            <!-- Urgency Message -->
            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 12px; padding: 20px; margin: 30px 0; text-align: center;">
              <p style="color: #92400e; font-size: 16px; margin: 0; font-weight: 600;">
                ⏰ Limited Stock Alert: Some items in your cart are running low!
              </p>
            </div>

            <!-- Benefits -->
            <div style="margin: 40px 0;">
              <h3 style="color: #1e293b; font-size: 20px; font-weight: 600; margin: 0 0 20px 0; text-align: center;">
                Why Shop With Us?
              </h3>
              <div style="display: grid; gap: 15px;">
                <div style="display: flex; align-items: center; gap: 15px;">
                  <span style="font-size: 24px;">🚚</span>
                  <div>
                    <h4 style="color: #1e293b; font-size: 16px; font-weight: 600; margin: 0;">Free Shipping</h4>
                    <p style="color: #64748b; font-size: 14px; margin: 0;">On orders over $99</p>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 15px;">
                  <span style="font-size: 24px;">🔒</span>
                  <div>
                    <h4 style="color: #1e293b; font-size: 16px; font-weight: 600; margin: 0;">Secure Checkout</h4>
                    <p style="color: #64748b; font-size: 14px; margin: 0;">Your payment is safe with us</p>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 15px;">
                  <span style="font-size: 24px;">↩️</span>
                  <div>
                    <h4 style="color: #1e293b; font-size: 16px; font-weight: 600; margin: 0;">Easy Returns</h4>
                    <p style="color: #64748b; font-size: 14px; margin: 0;">30-day return policy</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Need Help -->
            <div style="text-align: center; margin: 30px 0;">
              <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;">
                Need help with your order?
              </p>
              <a href="${storeUrl}/contact" style="color: #dc2626; text-decoration: none; font-weight: 600;">
                Contact our support team
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0 0 8px 0; font-weight: 500;">
              © 2024 ${storeName}. All rights reserved.
            </p>
            <p style="color: #64748b; font-size: 11px; margin: 0; line-height: 1.4;">
              ${storeName} - Premium Home Furniture & Décor<br>
              Transforming houses into luxury homes since 2024
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Don't forget your items at ${storeName}!
      
      Hi ${customerName}!
      
      You left some amazing items in your cart. Don't let them slip away!
      
      Your Cart Items:
      ${data.items.map(item => `- ${item.name} (Qty: ${item.quantity}) - $${item.price.toFixed(2)}`).join('\n')}
      
      Subtotal: $${data.subtotal.toFixed(2)}
      
      Complete your purchase: ${data.cartUrl}
      
      Why shop with us?
      🚚 Free shipping on orders over $99
      🔒 Secure checkout
      ↩️ Easy 30-day returns
      
      Need help? Contact us at ${storeUrl}/contact
      
      © 2024 ${storeName}. All rights reserved.
    `;

    return this.sendEmail({
      to: data.email,
      subject: `🛒 Don't forget your items at ${storeName}!`,
      html,
      text,
    });
  }

  async sendPromotionalEmail(data: PromotionalEmailData): Promise<boolean> {
    const customerName = data.customerName || 'Valued Customer';
    const storeName = process.env.NEXT_PUBLIC_STORE_NAME || 'ElanorraLiving';
    const storeUrl = process.env.NEXTAUTH_URL || 'https://elanorraliving.in';
    
    const {
      offer = 'Special Offer',
      message = 'Don\'t miss out on this amazing deal!',
      ctaText = 'Shop Now',
      ctaUrl = storeUrl,
      discount_code
    } = data.templateData;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); min-height: 100vh;">
        <div style="max-width: 650px; margin: 0 auto; background: #ffffff; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); border-radius: 16px; overflow: hidden;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 40px 30px; text-align: center; position: relative;">
            <h1 style="color: #ffffff; font-size: 32px; font-weight: 700; margin: 0 0 15px 0; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
              ${offer}
            </h1>
            <p style="color: #fecaca; font-size: 18px; margin: 0; font-weight: 500;">
              Exclusive offer just for you!
            </p>
          </div>

          <!-- Content -->
          <div style="padding: 50px 30px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h2 style="color: #1e293b; font-size: 24px; font-weight: 600; margin: 0 0 20px 0;">
                Hi ${customerName}! 👋
              </h2>
              <p style="color: #64748b; font-size: 18px; margin: 0; line-height: 1.6;">
                ${message}
              </p>
            </div>

            ${discount_code ? `
            <!-- Discount Code -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px dashed #f59e0b; border-radius: 12px; padding: 30px; margin: 40px 0; text-align: center;">
              <h3 style="color: #92400e; font-size: 20px; font-weight: 600; margin: 0 0 15px 0;">
                🎉 Your Exclusive Code
              </h3>
              <div style="background: #ffffff; border-radius: 8px; padding: 15px; margin: 15px 0;">
                <code style="color: #dc2626; font-size: 24px; font-weight: 700; letter-spacing: 2px;">
                  ${discount_code}
                </code>
              </div>
              <p style="color: #92400e; font-size: 14px; margin: 0;">
                Copy this code and use it at checkout
              </p>
            </div>
            ` : ''}

            <!-- CTA Button -->
            <div style="text-align: center; margin: 50px 0;">
              <a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: #ffffff; text-decoration: none; padding: 20px 40px; border-radius: 50px; font-size: 20px; font-weight: 600; box-shadow: 0 6px 20px rgba(220, 38, 38, 0.3); transition: all 0.3s ease;">
                ${ctaText} 🛍️
              </a>
            </div>

            <!-- Features -->
            <div style="margin: 50px 0;">
              <h3 style="color: #1e293b; font-size: 22px; font-weight: 600; margin: 0 0 25px 0; text-align: center;">
                Why Choose ${storeName}?
              </h3>
              <div style="display: grid; gap: 20px;">
                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
                  <div style="display: flex; align-items: center; gap: 15px;">
                    <span style="font-size: 28px;">🏆</span>
                    <div>
                      <h4 style="color: #1e293b; font-size: 18px; font-weight: 600; margin: 0;">Premium Quality</h4>
                      <p style="color: #64748b; font-size: 15px; margin: 5px 0 0 0;">Handpicked furniture and décor items</p>
                    </div>
                  </div>
                </div>
                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
                  <div style="display: flex; align-items: center; gap: 15px;">
                    <span style="font-size: 28px;">🚚</span>
                    <div>
                      <h4 style="color: #1e293b; font-size: 18px; font-weight: 600; margin: 0;">Fast Delivery</h4>
                      <p style="color: #64748b; font-size: 15px; margin: 5px 0 0 0;">Free shipping on orders over $99</p>
                    </div>
                  </div>
                </div>
                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
                  <div style="display: flex; align-items: center; gap: 15px;">
                    <span style="font-size: 28px;">💎</span>
                    <div>
                      <h4 style="color: #1e293b; font-size: 18px; font-weight: 600; margin: 0;">Customer Support</h4>
                      <p style="color: #64748b; font-size: 15px; margin: 5px 0 0 0;">24/7 support for all your needs</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Social Links -->
            <div style="text-align: center; margin: 40px 0;">
              <h4 style="color: #1e293b; font-size: 18px; font-weight: 600; margin: 0 0 20px 0;">
                Follow Us for More Deals
              </h4>
              <div style="display: flex; justify-content: center; gap: 20px;">
                <a href="${storeUrl}/social/facebook" style="color: #1877f2; text-decoration: none; font-size: 24px;">📘</a>
                <a href="${storeUrl}/social/instagram" style="color: #e4405f; text-decoration: none; font-size: 24px;">📷</a>
                <a href="${storeUrl}/social/pinterest" style="color: #bd081c; text-decoration: none; font-size: 24px;">📌</a>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0 0 8px 0; font-weight: 500;">
              © 2024 ${storeName}. All rights reserved.
            </p>
            <p style="color: #64748b; font-size: 11px; margin: 0; line-height: 1.4;">
              ${storeName} - Premium Home Furniture & Décor<br>
              Transforming houses into luxury homes since 2024
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      ${offer}
      
      Hi ${customerName}!
      
      ${message}
      
      ${discount_code ? `Your exclusive code: ${discount_code}` : ''}
      
      ${ctaText}: ${ctaUrl}
      
      Why choose ${storeName}?
      🏆 Premium Quality - Handpicked furniture and décor items
      🚚 Fast Delivery - Free shipping on orders over $99
      💎 Customer Support - 24/7 support for all your needs
      
      Follow us:
      Facebook: ${storeUrl}/social/facebook
      Instagram: ${storeUrl}/social/instagram
      Pinterest: ${storeUrl}/social/pinterest
      
      © 2024 ${storeName}. All rights reserved.
    `;

    return this.sendEmail({
      to: data.email,
      subject: data.subject,
      html,
      text,
    });
  }

  async sendInvoiceEmail(data: InvoiceEmailData): Promise<boolean> {
    try {
      const storeName = 'Elanorra Living';
      const storeUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://elanorraliving.in';
      const customerName = data.customerName || 'Valued Customer';
      const { formatPrice } = await import('./utils');

      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invoice - ${data.invoiceNumber}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
            .content { padding: 40px 30px; }
            .invoice-details { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .invoice-details h2 { margin: 0 0 15px 0; color: #333; font-size: 20px; }
            .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
            .detail-label { font-weight: 600; color: #666; }
            .detail-value { color: #333; }
            .total-amount { font-size: 24px; font-weight: bold; color: #667eea; text-align: center; margin: 20px 0; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; margin: 20px 0; }
            .footer { background-color: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; }
            .social-links { margin: 20px 0; }
            .social-links a { color: #667eea; text-decoration: none; margin: 0 10px; }
            @media (max-width: 600px) {
              .container { width: 100% !important; }
              .content { padding: 20px !important; }
              .header { padding: 20px !important; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${storeName}</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Your Invoice is Ready</p>
            </div>
            
            <div class="content">
              <h2 style="color: #333; margin-bottom: 20px;">Hello ${customerName}!</h2>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                Thank you for your purchase! Your invoice for order <strong>${data.orderNumber}</strong> is now ready. 
                Please find the invoice attached to this email for your records.
              </p>

              <div class="invoice-details">
                <h2>Invoice Details</h2>
                <div class="detail-row">
                  <span class="detail-label">Invoice Number:</span>
                  <span class="detail-value">${data.invoiceNumber}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Order Number:</span>
                  <span class="detail-value">${data.orderNumber}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Invoice Date:</span>
                  <span class="detail-value">${new Date(data.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
              </div>

              <div class="total-amount">
                Total Amount: ${formatPrice(data.totalAmount, { currency: data.currency as 'INR' | 'USD' })}
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${storeUrl}/profile/orders" class="cta-button">View Order Details</a>
              </div>

              <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h3 style="color: #1976d2; margin: 0 0 10px 0;">Need Help?</h3>
                <p style="color: #666; margin: 0; line-height: 1.6;">
                  If you have any questions about your invoice or order, please don't hesitate to contact our customer support team at 
                  <a href="mailto:info@elanorraliving.in" style="color: #1976d2;">info@elanorraliving.in</a>
                </p>
              </div>

              <p style="color: #666; line-height: 1.6; margin-top: 30px;">
                Thank you for choosing ${storeName}. We appreciate your business and look forward to serving you again!
              </p>
            </div>

            <div class="footer">
              <div class="social-links">
                <a href="${storeUrl}/social/facebook">Facebook</a>
                <a href="${storeUrl}/social/instagram">Instagram</a>
                <a href="${storeUrl}/social/pinterest">Pinterest</a>
              </div>
              <p style="margin: 15px 0 5px 0;">
                <strong>${storeName}</strong><br>
                Premium Furniture & Home Décor
              </p>
              <p style="margin: 5px 0;">
                © 2024 ${storeName}. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      const text = `
        ${storeName} - Invoice ${data.invoiceNumber}
        
        Hello ${customerName}!
        
        Thank you for your purchase! Your invoice for order ${data.orderNumber} is now ready.
        
        Invoice Details:
        - Invoice Number: ${data.invoiceNumber}
        - Order Number: ${data.orderNumber}
        - Invoice Date: ${new Date(data.createdAt).toLocaleDateString()}
        - Total Amount: ${formatPrice(data.totalAmount, { currency: data.currency as 'INR' | 'USD' })}
        
        Please find the invoice attached to this email for your records.
        
        View your order details: ${storeUrl}/profile/orders
        
        Need help? Contact us at info@elanorraliving.in
        
        Thank you for choosing ${storeName}!
        
        © 2024 ${storeName}. All rights reserved.
      `;

      // Send email with invoice attachment
      const fs = await import('fs');
      const path = await import('path');
      
      let attachments = [];
      if (data.invoiceFilePath && fs.existsSync(data.invoiceFilePath)) {
        attachments.push({
          filename: `Invoice-${data.invoiceNumber}.pdf`,
          path: data.invoiceFilePath,
          contentType: 'application/pdf'
        });
      }

      return this.sendEmail({
        to: data.email,
        subject: `Invoice ${data.invoiceNumber} - ${storeName}`,
        html,
        text,
        attachments
      });
    } catch (error) {
      console.error('Error sending invoice email:', error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Helper functions
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  firstName?: string
): Promise<boolean> {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;
  
  return emailService.sendPasswordResetEmail({
    email,
    firstName,
    resetToken,
    resetUrl,
  });
}

export async function sendVerificationEmail(
  email: string,
  verificationToken: string,
  firstName?: string
): Promise<boolean> {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${verificationToken}`;
  
  return emailService.sendEmail({
    to: email,
    subject: 'Welcome to Elanorra - Verify Your Email',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - Elanorra</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); min-height: 100vh;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); border-radius: 16px; overflow: hidden;">
          
          <!-- Header with gradient background -->
          <div style="background: linear-gradient(135deg, #f43f5e 0%, #fb7185 100%); padding: 40px 30px; text-align: center; position: relative;">
            <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 12px; padding: 20px; display: inline-block;">
              <div style="display: inline-block; background: rgba(255, 255, 255, 0.95); border-radius: 12px; padding: 12px; margin-bottom: 16px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" style="display: block;">
                  <defs>
                    <linearGradient id="logo-gradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stop-color="#f43f5e"/>
                      <stop offset="100%" stop-color="#fb7185"/>
                    </linearGradient>
                  </defs>
                  <rect x="0" y="0" width="48" height="48" rx="12" fill="url(#logo-gradient)"/>
                  <path d="M12 36c0-9.941 8.059-18 18-18h6v6h-6c-6.627 0-12 5.373-12 12v6h-6v-6z" fill="#ffffff" opacity="0.95"/>
                  <rect x="12" y="12" width="18" height="3.75" fill="#ffffff" opacity="0.95"/>
                  <rect x="12" y="22.125" width="12" height="3.75" fill="#ffffff" opacity="0.95"/>
                </svg>
              </div>
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); letter-spacing: -0.5px;">
                Elanorra
              </h1>
              <p style="color: rgba(255, 255, 255, 0.9); font-size: 14px; margin: 8px 0 0 0; font-weight: 500;">
                Luxury Living Redefined
              </p>
            </div>
          </div>

          <!-- Main content -->
          <div style="padding: 50px 40px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h2 style="color: #1e293b; font-size: 32px; font-weight: 700; margin: 0 0 16px 0; line-height: 1.2;">
                Welcome to Elanorra!
              </h2>
              <div style="width: 60px; height: 4px; background: linear-gradient(90deg, #f43f5e, #fb7185); margin: 0 auto; border-radius: 2px;"></div>
            </div>

            <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 16px; padding: 30px; margin-bottom: 30px; border: 1px solid #e2e8f0;">
              <p style="color: #475569; font-size: 18px; line-height: 1.6; margin: 0 0 20px 0;">
                Hello <strong style="color: #1e293b;">${firstName || 'there'}</strong>,
              </p>
              <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0;">
                Thank you for joining our exclusive community! To complete your registration and start exploring our curated collection of luxury furniture and home décor, please verify your email address.
              </p>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 40px 0;">
              <a href="${verificationUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #f43f5e 0%, #fb7185 100%); color: #ffffff; padding: 18px 36px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 20px rgba(244, 63, 94, 0.3); transition: all 0.3s ease; letter-spacing: 0.5px;">
                ✨ Verify Email Address
              </a>
            </div>

            <!-- Alternative link -->
            <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 30px 0; border-left: 4px solid #f43f5e;">
              <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">
                Can't click the button? Copy and paste this link:
              </p>
              <p style="word-break: break-all; color: #f43f5e; font-size: 13px; margin: 0; font-family: 'Courier New', monospace; background: #ffffff; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
                ${verificationUrl}
              </p>
            </div>

            <!-- Security notice -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 20px; margin: 30px 0; border: 1px solid #f59e0b;">
              <p style="color: #92400e; font-size: 14px; margin: 0; display: flex; align-items: center;">
                <span style="margin-right: 8px; font-size: 16px;">🔒</span>
                <strong>Security Notice:</strong> This verification link will expire in 24 hours for your security.
              </p>
            </div>

            <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 30px 0 0 0; text-align: center;">
              If you didn't create an account with Elanorra, you can safely ignore this email.
            </p>
          </div>

          <!-- Footer -->
          <div style="background: #1e293b; padding: 30px 40px; text-align: center;">
            <div style="margin-bottom: 20px;">
              <div style="display: inline-block; background: rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 8px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style="display: block;">
                  <defs>
                    <linearGradient id="footer-logo-gradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stop-color="#f43f5e"/>
                      <stop offset="100%" stop-color="#fb7185"/>
                    </linearGradient>
                  </defs>
                  <rect x="0" y="0" width="24" height="24" rx="6" fill="url(#footer-logo-gradient)"/>
                  <path d="M6 18c0-4.971 4.029-9 9-9h3v3h-3c-3.314 0-6 2.686-6 6v3H6v-3z" fill="#ffffff" opacity="0.95"/>
                  <rect x="6" y="6" width="9" height="1.875" fill="#ffffff" opacity="0.95"/>
                  <rect x="6" y="11.063" width="6" height="1.875" fill="#ffffff" opacity="0.95"/>
                </svg>
              </div>
            </div>
            <p style="color: #94a3b8; font-size: 12px; margin: 0 0 10px 0; font-weight: 500;">
              © 2024 Elanorra Living. All rights reserved.
            </p>
            <p style="color: #64748b; font-size: 11px; margin: 0; line-height: 1.4;">
              This email was sent from Elanorra. Please do not reply to this email.<br>
              For support, visit our website or contact our customer service team.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      ELANORRA - LUXURY LIVING REDEFINED
      
      Welcome to Elanorra!
      
      Hello ${firstName || 'there'},
      
      Thank you for joining our exclusive community! To complete your registration and start exploring our curated collection of luxury furniture and home décor, please verify your email address.
      
      Verify your email by visiting this link:
      ${verificationUrl}
      
      SECURITY NOTICE: This verification link will expire in 24 hours for your security.
      
      If you didn't create an account with Elanorra, you can safely ignore this email.
      
      ---
      © 2024 Elanorra Living. All rights reserved.
      This email was sent from Elanorra. Please do not reply to this email.
    `,
  });
}

export async function sendWelcomeEmail(
  email: string,
  firstName?: string,
  verificationToken?: string
): Promise<boolean> {
  const verificationUrl = verificationToken 
    ? `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${verificationToken}`
    : undefined;
  
  return emailService.sendWelcomeEmail({
    email,
    firstName,
    verificationUrl,
  });
}

export async function sendOrderConfirmationEmail(
  orderData: OrderConfirmationEmailData
): Promise<boolean> {
  return emailService.sendOrderConfirmationEmail(orderData);
}

export async function sendShippingNotificationEmail(
  orderData: ShippingNotificationEmailData
): Promise<boolean> {
  return emailService.sendShippingNotificationEmail(orderData);
}

// New Nodemailer-based email functions
export async function sendAbandonedCartEmail(
  data: AbandonedCartEmailData
): Promise<boolean> {
  return emailService.sendAbandonedCartEmail(data);
}

export async function sendPromotionalEmail(
  data: PromotionalEmailData
): Promise<boolean> {
  return emailService.sendPromotionalEmail(data);
}

export async function sendInvoiceEmail(
  data: InvoiceEmailData
): Promise<boolean> {
  return emailService.sendInvoiceEmail(data);
}

// Bulk promotional campaign function
export async function sendPromotionalCampaign(
  recipients: string[],
  subject: string,
  templateData: {
    offer?: string;
    message?: string;
    ctaText?: string;
    ctaUrl?: string;
    discount_code?: string;
    [key: string]: any;
  },
  campaignId?: string
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  // Send emails in batches to avoid overwhelming the SMTP server
  const batchSize = 10;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    
    const promises = batch.map(async (email) => {
      try {
        const success = await sendPromotionalEmail({
          email,
          subject,
          templateData,
          campaignId,
        });
        
        if (success) {
          sent++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Failed to send promotional email to ${email}:`, error);
        failed++;
      }
    });

    await Promise.all(promises);
    
    // Add a small delay between batches
    if (i + batchSize < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return { sent, failed };
}

// Cart abandonment tracking function
export async function trackCartAbandonment(data: AbandonedCartEmailData): Promise<void> {
  try {
    console.log(`Tracking cart abandonment for ${data.email}`);
    
    // Send abandoned cart email immediately or schedule it
    // In a real implementation, you might want to schedule this with a delay
    await sendAbandonedCartEmail(data);
  } catch (error) {
    console.error('Failed to track cart abandonment:', error);
  }
}