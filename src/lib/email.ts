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
        from: `"Elanorra Living" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
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
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e9ecef; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
            .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello ${firstName || 'there'},</p>
              
              <p>We received a request to reset the password for your account associated with <strong>${email}</strong>.</p>
              
              <p>Click the button below to reset your password:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px;">
                ${resetUrl}
              </p>
              
              <div class="warning">
                <strong>Important:</strong>
                <ul>
                  <li>This link will expire in 1 hour for security reasons</li>
                  <li>If you didn't request this password reset, please ignore this email</li>
                  <li>Your password will remain unchanged until you create a new one</li>
                </ul>
              </div>
              
              <p>If you're having trouble clicking the button, copy and paste the URL above into your web browser.</p>
              
              <p>Best regards,<br>The Elanorra Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply to this email.</p>
              <p>If you need help, contact our support team.</p>
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
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Elanorra</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e9ecef; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
            .button { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Elanorra!</h1>
            </div>
            <div class="content">
              <p>Hello ${firstName || 'there'},</p>
              
              <p>Welcome to Elanorra! We're excited to have you join our community.</p>
              
              ${verificationUrl ? `
                <p>To get started, please verify your email address by clicking the button below:</p>
                
                <div style="text-align: center;">
                  <a href="${verificationUrl}" class="button">Verify Email Address</a>
                </div>
                
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px;">
                  ${verificationUrl}
                </p>
              ` : `
                <p>Your account has been created successfully and you can start shopping right away!</p>
              `}
              
              <p>Here's what you can do with your new account:</p>
              <ul>
                <li>Browse our curated collection of premium furniture</li>
                <li>Save items to your wishlist</li>
                <li>Track your orders and delivery status</li>
                <li>Manage your addresses and payment methods</li>
                <li>Leave reviews and ratings</li>
              </ul>
              
              <p>If you have any questions, our customer support team is here to help.</p>
              
              <p>Happy shopping!<br>The Elanorra Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply to this email.</p>
              <p>If you need help, contact our support team.</p>
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
              <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZmF2aWNvbi1ncmFkaWVudCIgeDE9IjAiIHkxPSIwIiB4Mj0iMSIgeTI9IjEiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjZjQzZjVlIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI2ZiNzE4NSIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICA8L2RlZnM+CiAgPCEtLSBCYWNrZ3JvdW5kIHdpdGggcm91bmRlZCBjb3JuZXJzIC0tPgogIDxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgcng9IjYiIGZpbGw9InVybCgjZmF2aWNvbi1ncmFkaWVudCkiLz4KICA8IS0tIFNpbXBsaWZpZWQgIkUiIG1vbm9ncmFtIC0tPgogIDxwYXRoIGQ9Ik04IDI0YzAtNi42MjcgNS4zNzMtMTIgMTItMTJoNHYzaC00Yy00LjQxOCAwLTggMy41ODItOCA4djNIOHYtMnoiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuOTUiLz4KICA8cmVjdCB4PSI4IiB5PSI4IiB3aWR0aD0iMTIiIGhlaWdodD0iMi41IiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjk1Ii8+CiAgPHJlY3QgeD0iOCIgeT0iMTQuNzUiIHdpZHRoPSI4IiBoZWlnaHQ9IjIuNSIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC45NSIvPgo8L3N2Zz4=" 
                   alt="Elanorra Logo" 
                   style="width: 48px; height: 48px; margin-bottom: 16px; filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));">
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
              <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZmF2aWNvbi1ncmFkaWVudCIgeDE9IjAiIHkxPSIwIiB4Mj0iMSIgeTI9IjEiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjZjQzZjVlIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI2ZiNzE4NSIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICA8L2RlZnM+CiAgPCEtLSBCYWNrZ3JvdW5kIHdpdGggcm91bmRlZCBjb3JuZXJzIC0tPgogIDxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgcng9IjYiIGZpbGw9InVybCgjZmF2aWNvbi1ncmFkaWVudCkiLz4KICA8IS0tIFNpbXBsaWZpZWQgIkUiIG1vbm9ncmFtIC0tPgogIDxwYXRoIGQ9Ik04IDI0YzAtNi42MjcgNS4zNzMtMTIgMTItMTJoNHYzaC00Yy00LjQxOCAwLTggMy41ODItOCA4djNIOHYtMnoiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuOTUiLz4KICA8cmVjdCB4PSI4IiB5PSI4IiB3aWR0aD0iMTIiIGhlaWdodD0iMi41IiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjk1Ii8+CiAgPHJlY3QgeD0iOCIgeT0iMTQuNzUiIHdpZHRoPSI4IiBoZWlnaHQ9IjIuNSIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC45NSIvPgo8L3N2Zz4=" 
                   alt="Elanorra" 
                   style="width: 24px; height: 24px; opacity: 0.8;">
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