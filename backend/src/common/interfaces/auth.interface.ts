import { CompanyStatus, Role } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  companyId: string | null;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  companyId: string | null;
  active: boolean;
  /** Null para Super Admin sem empresa. Usado pelo SubscriptionGuard. */
  companyStatus: CompanyStatus | null;
}

export interface RequestCompanyContext {
  companyId: string;
  apiTokenId?: string;
  authType: 'jwt' | 'api_token';
}

declare global {
  namespace Express {
    // Augmenta Express.User (passport) em vez de redeclarar Request.user
    interface User extends AuthenticatedUser {}

    interface Request {
      companyContext?: RequestCompanyContext;
      apiToken?: {
        id: string;
        companyId: string;
        name: string;
      };
    }
  }
}

export {};
