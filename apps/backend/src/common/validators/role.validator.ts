import { ForbiddenException } from '@nestjs/common';

export enum UserRole {
  USER = 'user',
  MANAGER = 'manager',
  ADMIN = 'admin',
}

export class RoleValidator {
  /**
   * Validates if user has one of the allowed roles
   * @param userRole - The user's role
   * @param allowedRoles - Array of allowed roles
   * @param action - The action being performed (for error message)
   * @throws ForbiddenException if user doesn't have required role
   */
  static validateUserRole(userRole: string, allowedRoles: UserRole[], action: string): void {
    if (!allowedRoles.includes(userRole as UserRole)) {
      throw new ForbiddenException(
        `Access denied: ${action} requires one of the following roles: ${allowedRoles.join(', ')}. Your role: ${userRole}`
      );
    }
  }

  /**
   * Validates if user has admin role
   * @param userRole - The user's role
   * @param action - The action being performed
   */
  static validateAdminRole(userRole: string, action: string): void {
    this.validateUserRole(userRole, [UserRole.ADMIN], action);
  }

  /**
   * Validates if user has manager or admin role
   * @param userRole - The user's role
   * @param action - The action being performed
   */
  static validateManagerOrAdminRole(userRole: string, action: string): void {
    this.validateUserRole(userRole, [UserRole.MANAGER, UserRole.ADMIN], action);
  }

  /**
   * Validates if user has any valid role (user, manager, or admin)
   * @param userRole - The user's role
   * @param action - The action being performed
   */
  static validateAnyRole(userRole: string, action: string): void {
    this.validateUserRole(userRole, [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN], action);
  }

  /**
   * Validates if user can access notes (all roles can view, but with different scopes)
   * @param userRole - The user's role
   * @param action - The action being performed
   */
  static validateNoteAccess(userRole: string, action: string): void {
    this.validateAnyRole(userRole, action);
  }

  /**
   * Validates if user can create notes (admin only)
   * @param userRole - The user's role
   * @param action - The action being performed
   */
  static validateNoteCreation(userRole: string, action: string): void {
    this.validateAdminRole(userRole, action);
  }

  /**
   * Validates if user can edit/update notes (manager and admin)
   * @param userRole - The user's role
   * @param action - The action being performed
   */
  static validateNoteUpdate(userRole: string, action: string): void {
    this.validateManagerOrAdminRole(userRole, action);
  }

  /**
   * Validates if user can delete notes (admin only)
   * @param userRole - The user's role
   * @param action - The action being performed
   */
  static validateNoteDeletion(userRole: string, action: string): void {
    this.validateAdminRole(userRole, action);
  }

  /**
   * Validates if user can manage folders (admin only for create/delete, manager+admin for update)
   * @param userRole - The user's role
   * @param action - The action being performed
   */
  static validateFolderManagement(userRole: string, action: string): void {
    this.validateAdminRole(userRole, action);
  }

  /**
   * Validates if user can update folders (manager and admin)
   * @param userRole - The user's role
   * @param action - The action being performed
   */
  static validateFolderUpdate(userRole: string, action: string): void {
    this.validateManagerOrAdminRole(userRole, action);
  }

  /**
   * Validates if user can restore note versions (manager and admin)
   * @param userRole - The user's role
   * @param action - The action being performed
   */
  static validateVersionRestore(userRole: string, action: string): void {
    this.validateManagerOrAdminRole(userRole, action);
  }

  /**
   * Validates if user can manage users (admin and manager)
   * @param userRole - The user's role
   * @param action - The action being performed
   */
  static validateUserManagement(userRole: string, action: string): void {
    this.validateManagerOrAdminRole(userRole, action);
  }

  /**
   * Validates if user can delete users (admin only)
   * @param userRole - The user's role
   * @param action - The action being performed
   */
  static validateUserDeletion(userRole: string, action: string): void {
    this.validateAdminRole(userRole, action);
  }

  /**
   * Checks if user has admin role
   * @param userRole - The user's role
   * @returns boolean
   */
  static isAdmin(userRole: string): boolean {
    return userRole === UserRole.ADMIN;
  }

  /**
   * Checks if user has manager or admin role
   * @param userRole - The user's role
   * @returns boolean
   */
  static isManagerOrAdmin(userRole: string): boolean {
    return userRole === UserRole.MANAGER || userRole === UserRole.ADMIN;
  }

  /**
   * Checks if user can access all notes (manager or admin)
   * @param userRole - The user's role
   * @returns boolean
   */
  static canAccessAllNotes(userRole: string): boolean {
    return this.isManagerOrAdmin(userRole);
  }

  /**
   * Checks if user can only access their own notes
   * @param userRole - The user's role
   * @returns boolean
   */
  static canOnlyAccessOwnNotes(userRole: string): boolean {
    return userRole === UserRole.USER;
  }
}
