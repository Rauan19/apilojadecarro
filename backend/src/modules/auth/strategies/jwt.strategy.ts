import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { CompanyStatus } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {
  AuthenticatedUser,
  JwtPayload,
} from '../../../common/interfaces/auth.interface';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? '',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { company: true },
    });

    if (!user || !user.active) {
      throw new UnauthorizedException('Usuário inválido ou inativo');
    }

    if (user.companyId) {
      if (!user.company) {
        throw new UnauthorizedException('Empresa não encontrada');
      }

      // BLOCKED (inadimplência) não derruba o login: senão a loja não
      // consegue nem abrir a tela pra pagar e sair do bloqueio. Quem barra o
      // acesso é o SubscriptionGuard, que devolve 402 e libera o billing.
      if (user.company.status === CompanyStatus.INACTIVE) {
        throw new UnauthorizedException('Empresa inativa');
      }
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      active: user.active,
      companyStatus: user.company?.status ?? null,
    };
  }
}
