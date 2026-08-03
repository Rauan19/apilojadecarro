import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApiToken } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateApiTokenDto } from './dto/create-api-token.dto';

export type ApiTokenMasked = Omit<ApiToken, 'token'> & { token: string };

export interface ApiTokenCreated extends ApiToken {
  token: string;
}

@Injectable()
export class ApiTokensService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateApiTokenDto): Promise<ApiTokenCreated> {
    const company = await this.prisma.company.findUnique({
      where: { id: dto.companyId },
    });

    if (!company) {
      throw new NotFoundException('Cliente não encontrado');
    }

    const token = randomBytes(32).toString('hex');

    return this.prisma.apiToken.create({
      data: {
        companyId: dto.companyId,
        name: dto.name,
        token,
      },
    });
  }

  async findByCompany(companyId: string): Promise<ApiTokenMasked[]> {
    if (!companyId) {
      throw new BadRequestException('companyId é obrigatório');
    }

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });

    if (!company) {
      throw new NotFoundException('Cliente não encontrado');
    }

    const tokens = await this.prisma.apiToken.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    return tokens.map((item) => this.maskToken(item));
  }

  async findOne(id: string): Promise<ApiTokenMasked> {
    const token = await this.prisma.apiToken.findUnique({ where: { id } });

    if (!token) {
      throw new NotFoundException('Token de API não encontrado');
    }

    return this.maskToken(token);
  }

  async revoke(id: string): Promise<ApiTokenMasked> {
    await this.findOne(id);

    const token = await this.prisma.apiToken.update({
      where: { id },
      data: { active: false },
    });

    return this.maskToken(token);
  }

  async remove(id: string): Promise<ApiTokenMasked> {
    const token = await this.prisma.apiToken.findUnique({ where: { id } });

    if (!token) {
      throw new NotFoundException('Token de API não encontrado');
    }

    const deleted = await this.prisma.apiToken.delete({ where: { id } });
    return this.maskToken(deleted);
  }

  private maskToken(token: ApiToken): ApiTokenMasked {
    return {
      ...token,
      token: `${token.token.slice(0, 8)}...`,
    };
  }
}
