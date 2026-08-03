import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApiTokenMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.slice(7);

    // JWT tokens have 3 segments; API tokens are 64-char hex strings
    if (token.split('.').length === 3) {
      return next();
    }

    const apiToken = await this.prisma.apiToken.findUnique({
      where: { token },
      include: { company: true },
    });

    if (!apiToken || !apiToken.active) {
      throw new UnauthorizedException('Token de API inválido ou inativo');
    }

    if (apiToken.company.status !== 'ACTIVE') {
      throw new UnauthorizedException('Cliente bloqueado ou inativo');
    }

    await this.prisma.apiToken.update({
      where: { id: apiToken.id },
      data: { lastUsedAt: new Date() },
    });

    req.apiToken = {
      id: apiToken.id,
      companyId: apiToken.companyId,
      name: apiToken.name,
    };

    req.companyContext = {
      companyId: apiToken.companyId,
      apiTokenId: apiToken.id,
      authType: 'api_token',
    };

    next();
  }
}
