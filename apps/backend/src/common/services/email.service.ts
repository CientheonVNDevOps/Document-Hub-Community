import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;
  private adminEmail: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    
    if (apiKey) {
      this.resend = new Resend(apiKey);
    }
  }

  async sendUserRegistrationRequest(
    userEmail: string,
    userName: string,
    requestId: string
  ): Promise<void> {
    if (!this.resend) {
      console.log('Email service not configured - skipping email send');
      return;
    }

    const adminEmail = this.adminEmail;
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    try {
      await this.resend.emails.send({
        from: this.adminEmail,
        to: [adminEmail],
        subject: 'New User Registration Request',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">New User Registration Request</h2>
            <p>A new user has requested to join the platform:</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">User Details:</h3>
              <p><strong>Name:</strong> ${userName}</p>
              <p><strong>Email:</strong> ${userEmail}</p>
              <p><strong>Request ID:</strong> ${requestId}</p>
              <p><strong>Requested At:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <div style="margin: 20px 0;">
              <a href="${frontendUrl}/admin/approvals" 
                 style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Review Request
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              This is an automated message from your note-taking application.
            </p>
          </div>
        `,
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send registration request email');
    }
  }

  async sendApprovalNotification(
    userEmail: string,
    userName: string,
    approved: boolean,
    adminNotes?: string
  ): Promise<void> {
    if (!this.resend) {
      console.log('Email service not configured - skipping email send');
      return;
    }

    const subject = approved 
      ? 'Your Account Has Been Approved' 
      : 'Your Account Request Has Been Declined';

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    try {
      await this.resend.emails.send({
        from: this.adminEmail,
        to: [userEmail],
        subject,
        html: approved ? `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #28a745; border-bottom: 3px solid #28a745; padding-bottom: 10px;">
              🎉 Your Account Has Been Approved!
            </h2>
            
            <p>Hello ${userName},</p>
            
            <p>Great news! Your account request has been <strong>approved</strong> by an administrator. You can now access Document Community Hub and start managing your notes.</p>
            
            ${adminNotes ? `
              <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
                <h4 style="margin-top: 0;">Administrator Notes:</h4>
                <p>${adminNotes}</p>
              </div>
            ` : ''}
            
            <div style="background-color: #d4edda; padding: 20px; border-left: 4px solid #28a745; margin: 20px 0; border-radius: 5px;">
              <h3 style="margin-top: 0; color: #155724;">Welcome to Document Community Hub!</h3>
              <p style="margin-bottom: 15px;">Here's what you can do with your account:</p>
              
              <div style="background-color: white; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
                <h4 style="margin-top: 0; color: #333;">👁️ View Notes</h4>
                <ul style="margin: 0; padding-left: 20px; color: #666;">
                  <li>Browse and read your notes with ease</li>
                  <li>Full-text search to quickly find what you need</li>
                  <li>View version history to track changes</li>
                  <li>Rich text support for formatted content</li>
                </ul>
              </div>
              
              <div style="background-color: white; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
                <h4 style="margin-top: 0; color: #333;">📁 Folder Organization</h4>
                <ul style="margin: 0; padding-left: 20px; color: #666;">
                  <li>Organize notes in hierarchical folder structures</li>
                  <li>Create nested folders for better organization</li>
                  <li>Drag and drop to reorganize your content</li>
                  <li>Maintain a clean and intuitive workspace</li>
                </ul>
              </div>
              
              <div style="background-color: white; padding: 15px; border-radius: 5px; margin-bottom: 0;">
                <h4 style="margin-top: 0; color: #333;">🔐 Security & Access</h4>
                <ul style="margin: 0; padding-left: 20px; color: #666;">
                  <li>Secure authentication with JWT tokens</li>
                  <li>Role-based access control for your data</li>
                  <li>Row-level security protection</li>
                  <li>Your information is always safe and secure</li>
                </ul>
              </div>
            </div>
            
            <div style="background-color: #e7f3ff; padding: 20px; border-left: 4px solid #007bff; margin: 20px 0; border-radius: 5px;">
              <h4 style="margin-top: 0; color: #004085;">Getting Started</h4>
              <ol style="margin: 0; padding-left: 20px; color: #666;">
                <li>Click the login button below to access your account</li>
                <li>Enter your registered email and password</li>
                <li>Start creating your first note or folder!</li>
              </ol>
            </div>
            
            <div style="margin: 30px 0; text-align: center;">
              <a href="${frontendUrl}/login" 
                 style="background-color: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
                🚀 Login to Your Account
              </a>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 30px;">
              <p style="margin: 0; color: #666; font-size: 14px;">
                <strong>Need Help?</strong> Check out the documentation at <a href="${frontendUrl}/docs" style="color: #007bff;">${frontendUrl}/docs</a>
              </p>
              <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
                This is an automated message from Document Community Hub.
              </p>
            </div>
          </div>
        ` : `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc3545; border-bottom: 3px solid #dc3545; padding-bottom: 10px;">
              Account Request Declined
            </h2>
            
            <p>Hello ${userName},</p>
            
            <p>Unfortunately, your account request has been <strong>declined</strong> by an administrator.</p>
            
            ${adminNotes ? `
              <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
                <h4 style="margin-top: 0;">Administrator Notes:</h4>
                <p>${adminNotes}</p>
              </div>
            ` : ''}
            
            <p>If you believe this is an error, please contact the administrator.</p>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              This is an automated message from Document Community Hub.
            </p>
          </div>
        `,
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send approval notification email');
    }
  }

  async sendUserRegistrationConfirmation(
    userEmail: string,
    userName: string
  ): Promise<void> {
    if (!this.resend) {
      console.log('Email service not configured - skipping email send');
      return;
    }

    try {
      await this.resend.emails.send({
        from: this.adminEmail,
        to: [userEmail],
        subject: 'Registration Request Received',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Registration Request Received</h2>
            
            <p>Hello ${userName},</p>
            
            <p>Thank you for requesting an account on Document Community Hub!</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">What's Next?</h3>
              <p>Your registration request has been submitted and is now awaiting review by an administrator.</p>
              <p>You will receive an email notification once your account has been approved.</p>
            </div>
            
            <div style="background-color: #e7f3ff; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
              <h4 style="margin-top: 0;">Important Information:</h4>
              <ul style="margin: 0;">
                <li>Please keep this email for your records</li>
                <li>Approval typically takes 24-48 hours</li>
                <li>You will receive a follow-up email with login instructions once approved</li>
              </ul>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              If you have any questions, please contact the administrator.
            </p>
            
            <p style="color: #666; font-size: 14px;">
              This is an automated message from Document Community Hub.
            </p>
          </div>
        `,
      });
    } catch (error) {
      console.error('Failed to send registration confirmation email:', error);
      throw new Error('Failed to send registration confirmation email');
    }
  }
}
