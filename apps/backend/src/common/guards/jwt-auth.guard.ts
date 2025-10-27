import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      // Don't log "No auth token" errors - this is expected for public pages
      if (info && info.message === 'No auth token') {
        throw new UnauthorizedException('No auth token');
      }
      // Log other errors for debugging
      console.error('JWT Auth Error:', err, info);
      throw err || new UnauthorizedException('Invalid token');
    }
    return user;
  }
}
