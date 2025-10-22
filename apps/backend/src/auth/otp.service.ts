import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OtpService {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: any,
    private readonly configService: ConfigService,
  ) {}

  async generateOtp(email: string): Promise<string> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const key = `otp:${email}`;
    const ttl = 300; // 5 minutes
    
    await this.redis.setex(key, ttl, otp);
    
    // TODO: Send OTP via email/SMS service
    console.log(`OTP for ${email}: ${otp}`);
    
    return otp;
  }

  async verifyOtp(email: string, otp: string): Promise<boolean> {
    const key = `otp:${email}`;
    const storedOtp = await this.redis.get(key);
    
    if (!storedOtp) {
      return false;
    }
    
    const isValid = storedOtp === otp;
    
    if (isValid) {
      await this.redis.del(key);
    }
    
    return isValid;
  }

  async isRateLimited(email: string): Promise<boolean> {
    const key = `rate_limit:otp:${email}`;
    const attempts = await this.redis.get(key);
    
    const maxAttempts = 5;
    const windowMs = 15 * 60 * 1000; // 15 minutes
    
    if (attempts && parseInt(attempts) >= maxAttempts) {
      return true;
    }
    
    await this.redis.incr(key);
    await this.redis.expire(key, Math.floor(windowMs / 1000));
    
    return false;
  }
}
