import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CompanyStatus, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import {
  AuthenticatedUser,
  JwtPayload,
} from '../../common/interfaces/auth.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthResponseDto, AuthUserDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private static readonly BCRYPT_ROUNDS = 10;
  private static readonly PASSWORD_RESET_TTL_MS = 48 * 60 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
      include: { company: true },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordValid = await this.comparePassword(
      dto.password,
      user.password,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    this.assertUserAndCompanyActive(user);

    return this.generateTokens(user);
  }

  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          include: { company: true },
        },
      },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      if (storedToken) {
        await this.prisma.refreshToken.delete({
          where: { id: storedToken.id },
        });
      }
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    this.assertUserAndCompanyActive(storedToken.user);

    await this.prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    return this.generateTokens(storedToken.user);
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({
        where: { userId, token: refreshToken },
      });
      return;
    }

    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async me(userId: string): Promise<AuthUserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    this.assertUserAndCompanyActive(user);

    return this.toAuthUserDto(user);
  }

  async createPasswordChangeLink(userId: string): Promise<{
    url: string;
    expiresAt: Date;
  }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.active) {
      throw new BadRequestException('Usuário inválido ou inativo');
    }

    await this.prisma.passwordResetToken.deleteMany({
      where: { userId, usedAt: null },
    });

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + AuthService.PASSWORD_RESET_TTL_MS);

    await this.prisma.passwordResetToken.create({
      data: { userId, token, expiresAt },
    });

    const frontendUrl = (
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5173'
    ).replace(/\/$/, '');

    return {
      url: `${frontendUrl}/redefinir-senha?token=${token}`,
      expiresAt,
    };
  }

  async validatePasswordResetToken(token: string): Promise<{
    valid: boolean;
    email?: string;
    name?: string;
  }> {
    const record = await this.findValidResetToken(token);
    if (!record) {
      return { valid: false };
    }

    return {
      valid: true,
      email: record.user.email,
      name: record.user.name,
    };
  }

  async confirmPasswordReset(
    token: string,
    newPassword: string,
  ): Promise<void> {
    const record = await this.findValidResetToken(token);
    if (!record) {
      throw new BadRequestException('Link inválido ou expirado');
    }

    const password = await this.hashPassword(newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { password },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.refreshToken.deleteMany({
        where: { userId: record.userId },
      }),
    ]);
  }

  async generateTokens(
    user: User & { company?: { status: CompanyStatus } | null },
  ): Promise<AuthResponseDto> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = randomBytes(64).toString('hex');
    const refreshExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: this.calculateExpirationDate(refreshExpiresIn),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: this.toAuthUserDto(user),
    };
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, AuthService.BCRYPT_ROUNDS);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  toAuthenticatedUser(user: User): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      active: user.active,
    };
  }

  private async findValidResetToken(token: string) {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return null;
    }

    if (!record.user.active) {
      return null;
    }

    return record;
  }

  private assertUserAndCompanyActive(
    user: User & { company?: { status: CompanyStatus } | null },
  ): void {
    if (!user.active) {
      throw new UnauthorizedException('Usuário inativo');
    }

    if (user.companyId) {
      if (!user.company || user.company.status !== CompanyStatus.ACTIVE) {
        throw new UnauthorizedException('Empresa inativa ou bloqueada');
      }
    }
  }

  private toAuthUserDto(user: User): AuthUserDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
    };
  }

  private calculateExpirationDate(expiresIn: string): Date {
    const match = /^(\d+)([smhd])$/.exec(expiresIn.trim());

    if (!match) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + value * multipliers[unit]);
  }
}
