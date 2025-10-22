import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { EmailService } from '../common/services/email.service';
import * as bcrypt from 'bcrypt';

export interface CreateUserApprovalRequestDto {
  email: string;
  name: string;
  password: string;
}

export interface UpdateApprovalRequestDto {
  status: 'approved' | 'rejected';
  adminNotes?: string;
  reviewedBy: string;
}

@Injectable()
export class UserApprovalService {
  constructor(
    @Inject('SUPABASE_CLIENT') private readonly supabase: any,
    private readonly emailService: EmailService,
  ) {}

  async createApprovalRequest(createDto: CreateUserApprovalRequestDto) {
    // Check if user already exists
    const existingUser = await this.supabase
      .from('users')
      .select('id')
      .eq('email', createDto.email)
      .single();

    if (existingUser.data) {
      throw new BadRequestException('User with this email already exists');
    }

    // Check if there's already a pending request
    const existingRequest = await this.supabase
      .from('user_approval_requests')
      .select('id')
      .eq('email', createDto.email)
      .eq('status', 'pending')
      .single();

    if (existingRequest.data) {
      throw new BadRequestException('A pending request already exists for this email');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(createDto.password, 10);

    // Create the approval request
    const { data, error } = await this.supabase
      .from('user_approval_requests')
      .insert([{
        email: createDto.email,
        name: createDto.name,
        password: hashedPassword,
        status: 'pending',
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create approval request: ${error.message}`);
    }

    // Send email notification to admin
    try {
      await this.emailService.sendUserRegistrationRequest(
        createDto.email,
        createDto.name,
        data.id
      );
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't fail the request creation if email fails
    }

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      status: data.status,
      requestedAt: data.requested_at,
      message: 'Registration request submitted. You will be notified once an administrator reviews your request.'
    };
  }

  async getAllPendingRequests() {
    const { data, error } = await this.supabase
      .from('user_approval_requests')
      .select('*')
      .eq('status', 'pending')
      .order('requested_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch pending requests: ${error.message}`);
    }

    return data;
  }

  async getRequestById(id: string) {
    const { data, error } = await this.supabase
      .from('user_approval_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch request: ${error.message}`);
    }

    if (!data) {
      throw new NotFoundException('Approval request not found');
    }

    return data;
  }

  async updateRequestStatus(id: string, updateDto: UpdateApprovalRequestDto) {
    // Get the request
    const request = await this.getRequestById(id);
    
    if (request.status !== 'pending') {
      throw new BadRequestException('Request has already been processed');
    }

    if (updateDto.status === 'approved') {
      // Create the user account
      const { data: userData, error: userError } = await this.supabase
        .from('users')
        .insert([{
          email: request.email,
          name: request.name,
          password: request.password,
          role: 'user',
          status: 'approved',
        }])
        .select()
        .single();

      if (userError) {
        throw new Error(`Failed to create user: ${userError.message}`);
      }

      // Update the request status
      const { data: updatedRequest, error: requestError } = await this.supabase
        .from('user_approval_requests')
        .update({
          status: 'approved',
          admin_notes: updateDto.adminNotes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: updateDto.reviewedBy,
        })
        .eq('id', id)
        .select()
        .single();

      if (requestError) {
        throw new Error(`Failed to update request: ${requestError.message}`);
      }

      // Send approval notification
      try {
        await this.emailService.sendApprovalNotification(
          request.email,
          request.name,
          true,
          updateDto.adminNotes
        );
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError);
        // Don't fail the approval if email fails
      }

      return {
        request: updatedRequest,
        user: userData,
        message: 'User account created and approved successfully'
      };
    } else {
      // Reject the request
      const { data: updatedRequest, error: requestError } = await this.supabase
        .from('user_approval_requests')
        .update({
          status: 'rejected',
          admin_notes: updateDto.adminNotes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: updateDto.reviewedBy,
        })
        .eq('id', id)
        .select()
        .single();

      if (requestError) {
        throw new Error(`Failed to update request: ${requestError.message}`);
      }

      // Send rejection notification
      try {
        await this.emailService.sendApprovalNotification(
          request.email,
          request.name,
          false,
          updateDto.adminNotes
        );
      } catch (emailError) {
        console.error('Failed to send rejection email:', emailError);
        // Don't fail the rejection if email fails
      }

      return {
        request: updatedRequest,
        message: 'User request rejected successfully'
      };
    }
  }

  async getAllRequests() {
    const { data, error } = await this.supabase
      .from('user_approval_requests')
      .select('*')
      .order('requested_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch requests: ${error.message}`);
    }

    return data;
  }
}
