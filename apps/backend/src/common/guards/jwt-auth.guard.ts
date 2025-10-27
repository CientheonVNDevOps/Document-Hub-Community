import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      // Don't log errors for missing tokens - this is expected behavior
      if (err && info && info.message !== 'No auth token') {
        // Only log actual authentication errors
        if (info.name === 'TokenExpiredError') {
          // Token expired - this is a normal scenario, don't log
          throw new UnauthorizedException('Token has expired');
        } else if (info.name === 'JsonWebTokenError') {
          // Malformed token - don't log
          throw new UnauthorizedException('Invalid token');
        } else {
          // Other errors - log only important ones
          if (err?.message && !err.message.includes('No auth token')) {
            console.error('JWT Auth Error:', err, info);
          }
        }
      }
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
