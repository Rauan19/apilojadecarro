import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SubscriptionPlan } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

export type PlanResponse = Omit<SubscriptionPlan, 'features'> & {
  features: string[];
};

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePlanDto): Promise<PlanResponse> {
    const slug = await this.generateUniqueSlug(dto.name, dto.slug);

    const plan = await this.prisma.subscriptionPlan.create({
      data: {
        name: dto.name.trim(),
        slug,
        description: dto.description?.trim() || null,
        priceMonthly: dto.priceMonthly,
        features: JSON.stringify(this.normalizeFeatures(dto.features)),
        maxVehicles: dto.maxVehicles ?? null,
        maxUsers: dto.maxUsers ?? null,
        active: dto.active ?? true,
        sortOrder: dto.sortOrder ?? 0,
        companyId: dto.companyId ?? null,
      },
    });

    return this.toResponse(plan);
  }

  /**
   * @param visibleToCompanyId visão do dono da loja: planos públicos + os
   * exclusivos dessa empresa. `null` traz só os públicos; `undefined` traz
   * tudo, inclusive exclusivos de outras lojas (visão do Super Admin).
   */
  async findAll(
    activeOnly = false,
    visibleToCompanyId?: string | null,
  ): Promise<PlanResponse[]> {
    const where: Prisma.SubscriptionPlanWhereInput = {};

    if (activeOnly) {
      where.active = true;
    }

    if (visibleToCompanyId !== undefined) {
      where.OR = visibleToCompanyId
        ? [{ companyId: null }, { companyId: visibleToCompanyId }]
        : [{ companyId: null }];
    }

    const plans = await this.prisma.subscriptionPlan.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { priceMonthly: 'asc' }, { name: 'asc' }],
    });

    return plans.map((plan) => this.toResponse(plan));
  }

  async findOne(id: string): Promise<PlanResponse> {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!plan) {
      throw new NotFoundException('Plano não encontrado');
    }
    return this.toResponse(plan);
  }

  async update(id: string, dto: UpdatePlanDto): Promise<PlanResponse> {
    await this.findOne(id);

    if (dto.slug) {
      const existing = await this.prisma.subscriptionPlan.findUnique({
        where: { slug: dto.slug },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Slug do plano já está em uso');
      }
    }

    const data: Prisma.SubscriptionPlanUpdateInput = {};

    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.slug !== undefined) data.slug = dto.slug.trim();
    if (dto.description !== undefined) {
      data.description = dto.description?.trim() || null;
    }
    if (dto.priceMonthly !== undefined) data.priceMonthly = dto.priceMonthly;
    if (dto.features !== undefined) {
      data.features = JSON.stringify(this.normalizeFeatures(dto.features));
    }
    if (dto.maxVehicles !== undefined) data.maxVehicles = dto.maxVehicles;
    if (dto.maxUsers !== undefined) data.maxUsers = dto.maxUsers;
    if (dto.active !== undefined) data.active = dto.active;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
    if (dto.companyId !== undefined) {
      data.exclusiveTo = dto.companyId
        ? { connect: { id: dto.companyId } }
        : { disconnect: true };
    }

    const plan = await this.prisma.subscriptionPlan.update({
      where: { id },
      data,
    });

    return this.toResponse(plan);
  }

  async remove(id: string): Promise<PlanResponse> {
    const plan = await this.findOne(id);

    const inUse = await this.prisma.company.count({ where: { planId: id } });
    if (inUse > 0) {
      throw new BadRequestException(
        `Não é possível remover: ${inUse} cliente(s) usam este plano. Reatribua-os antes.`,
      );
    }

    const deleted = await this.prisma.subscriptionPlan.delete({ where: { id } });
    return this.toResponse(deleted);
  }

  private normalizeFeatures(features: string[]): string[] {
    const cleaned = features.map((f) => f.trim()).filter(Boolean);
    if (cleaned.length === 0) {
      throw new BadRequestException('Informe ao menos um item do que o plano inclui');
    }
    return cleaned;
  }

  private toResponse(plan: SubscriptionPlan): PlanResponse {
    let features: string[] = [];
    try {
      const parsed = JSON.parse(plan.features);
      features = Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      features = [];
    }

    return { ...plan, features };
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
    if (!base) base = 'plano';

    let slug = base;
    let counter = 1;
    while (
      await this.prisma.subscriptionPlan.findUnique({ where: { slug } })
    ) {
      slug = `${base}-${counter}`;
      counter += 1;
    }
    return slug;
  }
}
