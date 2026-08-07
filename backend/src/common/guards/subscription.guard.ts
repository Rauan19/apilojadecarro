import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CompanyStatus, Role } from '@prisma/client';
import { ALLOW_WHEN_BLOCKED_KEY, IS_PUBLIC_KEY } from '../decorators';
import { AuthenticatedUser } from '../interfaces/auth.interface';

/** Código lido pelo painel para abrir a tela de renovação. */
export const SUBSCRIPTION_BLOCKED_CODE = 'SUBSCRIPTION_BLOCKED';

/**
 * Barra a loja inadimplente no resto do sistema, mas mantém aberto o caminho
 * para ela pagar. Responde 402 Payment Required — e não 401 — para o painel
 * saber que é cobrança, não sessão expirada, e não deslogar o usuário.
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const allowWhenBlocked = this.reflector.getAllAndOverride<boolean>(
      ALLOW_WHEN_BLOCKED_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (allowWhenBlocked) return true;

    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
      companyContext?: unknown;
    }>();

    // Integrações por token de API não passam por aqui: a vitrine pública da
    // loja continua no ar mesmo com a mensalidade atrasada.
    if (!request.user && request.companyContext) return true;

    const user = request.user;
    if (!user) return true;

    // Super Admin nunca é bloqueado — é quem resolve o problema.
    if (user.role === Role.SUPER_ADMIN) return true;

    if (user.companyStatus === CompanyStatus.BLOCKED) {
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          message:
            'Assinatura pendente. Regularize o pagamento para voltar a usar o sistema.',
          code: SUBSCRIPTION_BLOCKED_CODE,
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    return true;
  }
}
