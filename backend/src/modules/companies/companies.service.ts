import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Company, CompanyStatus, Role, SubscriptionPlan } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import {
  buildPaginatedResult,
  PaginatedResult,
  PaginationDto,
} from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import {
  CompaniesRepository,
  CompanyStatsOverview,
  CompanyWithPlan,
} from './companies.repository';
import { ChangePlanDto } from './dto/change-plan.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

export type SerializedPlan = Omit<SubscriptionPlan, 'features'> & {
  features: string[];
};

export type SerializedCompany = Omit<Company, never> & {
  plan: SerializedPlan | null;
};

export interface CreateCompanyResult {
  company: SerializedCompany;
  admin: {
    id: string;
    name: string;
    email: string;
  };
  passwordChangeUrl: string;
  passwordChangeExpiresAt: Date;
}

@Injectable()
export class CompaniesService {
  private readonly uploadBasePath = path.resolve('uploads');

  constructor(
    private readonly companiesRepository: CompaniesRepository,
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async create(dto: CreateCompanyDto): Promise<CreateCompanyResult> {
    if (dto.settings) {
      this.assertValidJson(dto.settings, 'settings');
    }

    if (dto.planId) {
      await this.assertPlanExists(dto.planId);
    }

    const adminEmail = (dto.adminEmail ?? dto.email).toLowerCase().trim();
    const adminName = dto.adminName?.trim() || 'Administrador';

    const emailTaken = await this.prisma.user.findUnique({
      where: { email: adminEmail },
    });
    if (emailTaken) {
      throw new ConflictException('Já existe um usuário com este e-mail de admin');
    }

    const slug = await this.generateUniqueSlug(dto.name, dto.slug);
    const passwordHash = await this.authService.hashPassword(dto.adminPassword);

    const created = await this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: dto.name,
          slug,
          document: dto.document,
          email: dto.email,
          phone: dto.phone,
          address: dto.address,
          city: dto.city,
          state: dto.state,
          zipCode: dto.zipCode,
          logo: dto.logo,
          website: dto.website,
          status: dto.status ?? CompanyStatus.ACTIVE,
          settings: dto.settings,
          ...(dto.planId ? { planId: dto.planId } : {}),
        },
        include: { plan: true },
      });

      const admin = await tx.user.create({
        data: {
          name: adminName,
          email: adminEmail,
          password: passwordHash,
          role: Role.STORE_ADMIN,
          companyId: company.id,
          phone: dto.phone,
          active: true,
        },
      });

      return { company, admin };
    });

    this.ensureUploadFolder(created.company.id);

    const link = await this.authService.createPasswordChangeLink(created.admin.id);

    return {
      company: this.serializeCompany(created.company),
      admin: {
        id: created.admin.id,
        name: created.admin.name,
        email: created.admin.email,
      },
      passwordChangeUrl: link.url,
      passwordChangeExpiresAt: link.expiresAt,
    };
  }

  async createPasswordChangeLink(companyId: string): Promise<{
    url: string;
    expiresAt: Date;
    adminEmail: string;
    adminName: string;
  }> {
    await this.findOne(companyId);

    const admin = await this.prisma.user.findFirst({
      where: {
        companyId,
        role: Role.STORE_ADMIN,
        active: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!admin) {
      throw new NotFoundException(
        'Este cliente ainda não tem um admin da loja. Crie o usuário em Usuários.',
      );
    }

    const link = await this.authService.createPasswordChangeLink(admin.id);
    return {
      ...link,
      adminEmail: admin.email,
      adminName: admin.name,
    };
  }

  async findAll(
    pagination: PaginationDto,
  ): Promise<PaginatedResult<SerializedCompany>> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    const { items, total } = await this.companiesRepository.findMany({
      skip,
      take: limit,
      search: pagination.search,
      sortBy: pagination.sortBy,
      sortOrder: pagination.sortOrder,
    });

    return buildPaginatedResult(
      items.map((item) => this.serializeCompany(item)),
      total,
      page,
      limit,
    );
  }

  async findOne(id: string): Promise<SerializedCompany> {
    const company = await this.companiesRepository.findById(id);
    if (!company) {
      throw new NotFoundException('Cliente não encontrado');
    }
    return this.serializeCompany(company);
  }

  async update(id: string, dto: UpdateCompanyDto): Promise<SerializedCompany> {
    await this.findOne(id);

    if (dto.settings) {
      this.assertValidJson(dto.settings, 'settings');
    }

    if (dto.slug) {
      const existing = await this.companiesRepository.findBySlug(dto.slug);
      if (existing && existing.id !== id) {
        throw new ConflictException('Slug já está em uso');
      }
    }

    if (dto.planId) {
      await this.assertPlanExists(dto.planId);
    }

    const { planId, ...rest } = dto;

    const updated = await this.companiesRepository.update(id, {
      ...rest,
      ...(planId !== undefined
        ? planId
          ? { plan: { connect: { id: planId } } }
          : { plan: { disconnect: true } }
        : {}),
    });
    return this.serializeCompany(updated);
  }

  async remove(id: string): Promise<SerializedCompany> {
    await this.findOne(id);
    return this.serializeCompany(await this.companiesRepository.delete(id));
  }

  async block(id: string): Promise<SerializedCompany> {
    await this.findOne(id);
    return this.serializeCompany(
      await this.companiesRepository.update(id, {
        status: CompanyStatus.BLOCKED,
      }),
    );
  }

  async activate(id: string): Promise<SerializedCompany> {
    await this.findOne(id);
    return this.serializeCompany(
      await this.companiesRepository.update(id, {
        status: CompanyStatus.ACTIVE,
      }),
    );
  }

  async changePlan(id: string, dto: ChangePlanDto): Promise<SerializedCompany> {
    await this.findOne(id);
    await this.assertPlanExists(dto.planId);
    return this.serializeCompany(
      await this.companiesRepository.update(id, {
        plan: { connect: { id: dto.planId } },
      }),
    );
  }

  async getStatsOverview(): Promise<CompanyStatsOverview> {
    return this.companiesRepository.getStatsOverview();
  }

  private async assertPlanExists(planId: string): Promise<void> {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) {
      throw new NotFoundException('Plano não encontrado');
    }
    if (!plan.active) {
      throw new BadRequestException('Este plano está inativo');
    }
  }

  private ensureUploadFolder(companyId: string): void {
    const folderPath = path.join(this.uploadBasePath, `empresa-${companyId}`);
    fs.mkdirSync(folderPath, { recursive: true });
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private async generateUniqueSlug(
    name: string,
    providedSlug?: string,
  ): Promise<string> {
    let base = providedSlug?.trim() || this.slugify(name);
    if (!base) {
      base = 'empresa';
    }

    let slug = base;
    let counter = 1;

    while (await this.companiesRepository.findBySlug(slug)) {
      slug = `${base}-${counter}`;
      counter += 1;
    }

    return slug;
  }

  private assertValidJson(value: string, field: string): void {
    try {
      JSON.parse(value);
    } catch {
      throw new BadRequestException(
        `O campo ${field} deve conter um JSON válido`,
      );
    }
  }

  private serializeCompany(company: CompanyWithPlan): SerializedCompany {
    if (!company.plan) {
      return { ...company, plan: null };
    }

    let features: string[] = [];
    try {
      const parsed = JSON.parse(company.plan.features);
      features = Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      features = [];
    }

    return {
      ...company,
      plan: {
        ...company.plan,
        features,
      },
    };
  }
}
