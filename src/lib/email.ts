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

// Email service with nodemailer
class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, // true for 465, false for other ports
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

  async sendNewsletterSubscriptionConfirmation(email: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Elanorra Newsletter</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); min-height: 100vh;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); border-radius: 16px; overflow: hidden;">
          
          <!-- Header with gradient background -->
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%); padding: 40px 30px; text-align: center; position: relative;">
            <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 12px; padding: 20px; display: inline-block;">
              <div style="display: inline-block; background: rgba(255, 255, 255, 0.95); border-radius: 12px; padding: 12px; margin-bottom: 16px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" style="display: block;">
                  <defs>
                    <linearGradient id="newsletter-logo-gradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" style="stop-color:#8b5cf6"/>
                      <stop offset="100%" style="stop-color:#a855f7"/>
                    </linearGradient>
                  </defs>
                  <path d="M24 4L6 14v20c0 11.05 7.95 20 18 20s18-8.95 18-20V14L24 4z" fill="url(#newsletter-logo-gradient)"/>
                  <path d="M24 16l-8 6v12h16V22l-8-6z" fill="white" opacity="0.9"/>
                </svg>
              </div>
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                Welcome to Our Newsletter!
              </h1>
              <p style="color: rgba(255, 255, 255, 0.9); font-size: 16px; margin: 8px 0 0 0; font-weight: 500;">
                You're now part of the Elanorra community
              </p>
            </div>
          </div>

          <!-- Main content -->
          <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #1e293b; font-size: 24px; font-weight: 600; margin: 0 0 15px 0;">
                🎉 Subscription Confirmed!
              </h2>
              <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0;">
                Thank you for subscribing to the Elanorra newsletter! You'll now receive exclusive offers, design inspiration, and the latest updates on luxury home living.
              </p>
            </div>

            <!-- What to expect section -->
            <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 16px; padding: 30px; margin: 30px 0; border: 1px solid #e2e8f0;">
              <h3 style="color: #1e293b; font-size: 20px; font-weight: 600; margin: 0 0 20px 0; text-align: center;">
                What to Expect
              </h3>
              
              <div style="display: grid; gap: 15px;">
                <div style="display: flex; align-items: flex-start;">
                  <span style="font-size: 20px; margin-right: 12px; margin-top: 2px;">✨</span>
                  <div>
                    <h4 style="color: #1e293b; font-size: 16px; font-weight: 600; margin: 0 0 5px 0;">Exclusive Offers</h4>
                    <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.5;">
                      Be the first to know about sales, discounts, and special promotions.
                    </p>
                  </div>
                </div>

                <div style="display: flex; align-items: flex-start;">
                  <span style="font-size: 20px; margin-right: 12px; margin-top: 2px;">🏡</span>
                  <div>
                    <h4 style="color: #1e293b; font-size: 16px; font-weight: 600; margin: 0 0 5px 0;">Design Inspiration</h4>
                    <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.5;">
                      Get curated home décor ideas and styling tips from our design experts.
                    </p>
                  </div>
                </div>

                <div style="display: flex; align-items: flex-start;">
                  <span style="font-size: 20px; margin-right: 12px; margin-top: 2px;">🆕</span>
                  <div>
                    <h4 style="color: #1e293b; font-size: 16px; font-weight: 600; margin: 0 0 5px 0;">New Arrivals</h4>
                    <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.5;">
                      Discover the latest additions to our premium furniture collection.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 40px 0;">
              <a href="${process.env.NEXTAUTH_URL}/shop" 
                 style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3); transition: all 0.3s ease;">
                🛍️ Start Shopping
              </a>
            </div>

            <!-- Unsubscribe notice -->
            <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 30px 0; border-left: 4px solid #8b5cf6;">
              <p style="color: #64748b; font-size: 14px; margin: 0; text-align: center;">
                You can unsubscribe from these emails at any time by clicking the unsubscribe link in any newsletter email.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
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
      Welcome to Elanorra Newsletter!
      
      Subscription Confirmed!
      
      Thank you for subscribing to the Elanorra newsletter! You'll now receive exclusive offers, design inspiration, and the latest updates on luxury home living.
      
      What to Expect:
      - Exclusive Offers: Be the first to know about sales, discounts, and special promotions
      - Design Inspiration: Get curated home décor ideas and styling tips from our design experts
      - New Arrivals: Discover the latest additions to our premium furniture collection
      
      Start shopping: ${process.env.NEXTAUTH_URL}/shop
      
      You can unsubscribe from these emails at any time by clicking the unsubscribe link in any newsletter email.
      
      ---
      © 2024 Elanorra Living. All rights reserved.
      This email was sent from Elanorra. Please do not reply to this email.
    `;

    return this.sendEmail({
      to: email,
      subject: 'Welcome to Elanorra Newsletter - Subscription Confirmed!',
      html,
      text,
    });
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