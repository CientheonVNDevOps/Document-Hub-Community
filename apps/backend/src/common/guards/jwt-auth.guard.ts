import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      // Only log errors that are not related to missing tokens
      if (info && info.name !== 'JsonWebTokenError' && err?.message !== 'No auth token') {
        console.error('JWT Auth Error:', err, info);
      }
      throw err || new UnauthorizedException('Invalid token');
    }
    return user;
  }
}
