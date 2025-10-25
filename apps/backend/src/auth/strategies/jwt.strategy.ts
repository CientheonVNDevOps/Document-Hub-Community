import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService, JwtPayload } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      console.warn('JWT_SECRET not provided, using default secret for development');
    }
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret || 'default-secret-for-development',
    });
  }

  async validate(payload: JwtPayload) {    
    // Validate that payload.sub (user ID) is present and valid
    if (!payload.sub) {
      console.error('JWT Strategy - Missing user ID in payload');
      throw new UnauthorizedException('Invalid token: missing user ID');
    }
    
    // Basic UUID validation for payload.sub
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(payload.sub)) {
      console.error('JWT Strategy - Invalid user ID format:', payload.sub);
      throw new UnauthorizedException('Invalid token: invalid user ID format');
    }
    
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
