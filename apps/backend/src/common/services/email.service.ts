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
        from: 'noreply@yourdomain.com', // Replace with your verified domain
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
    
    const statusText = approved ? 'approved' : 'declined';
    const actionText = approved 
      ? 'You can now log in to your account and start using the platform.'
      : 'If you believe this is an error, please contact the administrator.';

    try {
      await this.resend.emails.send({
        from: 'noreply@yourdomain.com', // Replace with your verified domain
        to: [userEmail],
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: ${approved ? '#28a745' : '#dc3545'};">
              Account Request ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}
            </h2>
            
            <p>Hello ${userName},</p>
            
            <p>Your account request has been <strong>${statusText}</strong> by an administrator.</p>
            
            ${adminNotes ? `
              <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
                <h4 style="margin-top: 0;">Administrator Notes:</h4>
                <p>${adminNotes}</p>
              </div>
            ` : ''}
            
            <p>${actionText}</p>
            
            ${approved ? `
              <div style="margin: 20px 0;">
                <a href="${this.configService.get<string>('FRONTEND_URL')}/login" 
                   style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Login to Your Account
                </a>
              </div>
            ` : ''}
            
            <p style="color: #666; font-size: 14px;">
              This is an automated message from your note-taking application.
            </p>
          </div>
        `,
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send approval notification email');
    }
  }
}
