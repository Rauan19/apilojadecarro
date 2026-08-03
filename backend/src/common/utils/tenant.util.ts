import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthenticatedUser } from '../interfaces/auth.interface';

export function resolveTenantCompanyId(
  actor: AuthenticatedUser,
  queryCompanyId?: string,
): string {
  if (actor.role === Role.SUPER_ADMIN) {
    const companyId = queryCompanyId ?? actor.companyId;
    if (!companyId) {
      throw new BadRequestException(
        'companyId é obrigatório (informe via query ou vincule ao usuário)',
      );
    }
    return companyId;
  }

  if (!actor.companyId) {
    throw new ForbiddenException('Usuário sem empresa vinculada');
  }

  return actor.companyId;
}
