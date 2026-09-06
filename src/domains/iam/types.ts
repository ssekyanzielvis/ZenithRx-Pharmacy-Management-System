/**
 * Bounded Context: Identity & Access Management (IAM)
 * Complies with technical.md §11.6 & §11.22
 */

export type UserRole =
  | 'Super Admin'
  | 'Admin'
  | 'Pharmacist'
  | 'Cashier'
  | 'Inventory Manager'
  | 'Auditor';

export interface UserSessionDto {
  userId: string;
  tenantId: string;
  username: string;
  fullName: string;
  role: UserRole;
  token: string;
  expiresAt: string;
  isMfaVerified: boolean;
}

export interface AuthenticateUserRequestDto {
  username: string;
  passwordHash?: string;
  pin?: string;
  tenantId?: string;
}

export interface PermissionCheckResultDto {
  allowed: boolean;
  reason?: string;
  requiredRole?: UserRole[];
}
