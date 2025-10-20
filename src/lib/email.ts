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
        from: `"Elanorra" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
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
    subject: 'Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify Your Email Address</h2>
        <p>Hello ${firstName || 'there'},</p>
        <p>Thank you for creating an account! Please click the button below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        <p>This verification link will expire in 24 hours.</p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This email was sent from Elanorra. Please do not reply to this email.
        </p>
      </div>
    `,
    text: `
      Verify Your Email Address
      
      Hello ${firstName || 'there'},
      
      Thank you for creating an account! Please visit the following link to verify your email address:
      
      ${verificationUrl}
      
      This verification link will expire in 24 hours.
      
      If you didn't create an account, you can safely ignore this email.
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