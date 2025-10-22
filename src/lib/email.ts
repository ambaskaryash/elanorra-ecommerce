// Email service for sending transactional emails using nodemailer
import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
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
      const mailOptions = {
        from: `"Elanorra Living" <info@elanorraliving.in>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

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

  async sendOrderConfirmationEmail(orderData: any): Promise<boolean> {
    // TODO: Implement order confirmation email
    console.log('Order confirmation email would be sent for order:', orderData.orderNumber);
    return true;
  }

  async sendShippingNotificationEmail(orderData: any): Promise<boolean> {
    // TODO: Implement shipping notification email
    console.log('Shipping notification email would be sent for order:', orderData.orderNumber);
    return true;
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