import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { OtpService } from './otp.service';
import { UserApprovalService } from '../users/user-approval.service';
import * as bcrypt from 'bcrypt';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService,
    private readonly userApprovalService: UserApprovalService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (isPasswordValid) {
        // Check if user is approved
        if (user.status !== 'approved') {
          throw new UnauthorizedException('Your account is pending approval. Please wait for an administrator to approve your request.');
        }
        const { password, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async login(user: any) {
    // Handle both name field and first_name/last_name fields
    const fullName = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim();
    
    console.log('Login - User object:', { id: user.id, email: user.email, role: user.role });
    
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: fullName,
      },
    };
  }

  async register(email: string, password: string, name: string) {
    return await this.userApprovalService.createApprovalRequest({
      email,
      password,
      name,
    });
  }

  async requestOtp(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    
    return await this.otpService.generateOtp(email);
  }

  async verifyOtp(email: string, otp: string) {
    const isValid = await this.otpService.verifyOtp(email, otp);
    if (!isValid) {
      throw new UnauthorizedException('Invalid OTP');
    }
    
    const user = await this.usersService.findByEmail(email);
    return this.login(user);
  }

  async logout(userId: string) {
    // In a stateless JWT system, logout is primarily handled client-side
    // You could implement token blacklisting here if needed
    // For now, we'll just return a success message
    // Future enhancement: Add token to blacklist in Redis
    return { message: 'Logout successful' };
  }
}
