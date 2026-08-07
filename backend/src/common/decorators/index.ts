import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthenticatedUser } from '../interfaces/auth.interface';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export const ALLOW_WHEN_BLOCKED_KEY = 'allowWhenBlocked';
/**
 * Libera a rota para empresa bloqueada por inadimplência. Use só no que a
 * loja precisa para voltar a pagar (assinatura, faturas, dados da empresa) —
 * o resto do sistema deve continuar barrado com 402.
 */
export const AllowWhenBlocked = () =>
  SetMetadata(ALLOW_WHEN_BLOCKED_KEY, true);

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

export const CompanyId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest();
    return (
      request.companyContext?.companyId ??
      request.query?.companyId ??
      request.user?.companyId ??
      null
    );
  },
);
