import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    console.log('Roles Guard - Required roles:', requiredRoles, 'User role:', user?.role);
    
    if (!user) {
      console.log('Roles Guard - No user found in request');
      return false;
    }
    
    const hasRole = requiredRoles.some((role) => user.role === role);
    console.log('Roles Guard - Has required role:', hasRole);
    return hasRole;
  }
}
