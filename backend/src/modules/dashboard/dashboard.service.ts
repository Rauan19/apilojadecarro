import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  LeadStatus,
  ProposalStatus,
  Role,
  VehicleStatus,
} from '@prisma/client';
import { AuthenticatedUser } from '../../common/interfaces/auth.interface';
import { PrismaService } from '../../prisma/prisma.service';

export interface DashboardCounts {
  vehicles: {
    total: number;
    available: number;
    sold: number;
    reserved: number;
    maintenance: number;
  };
  customers: number;
  users: number;
  sellers: number;
  proposals: number;
  schedules: number;
  leads: Record<LeadStatus, number>;
}

export interface DashboardCharts {
  vehiclesByMonth: { month: string; count: number }[];
  leadsByStatus: { status: LeadStatus; count: number }[];
  vehiclesByStatus: { status: VehicleStatus; count: number }[];
  revenueByMonth: { month: string; total: number }[];
}

export interface BillingPlanRow {
  planId: string;
  name: string;
  priceMonthly: number;
  count: number;
  mrr: number;
}

export interface DashboardData {
  counts: DashboardCounts;
  charts: DashboardCharts;
  revenue: {
    total: number;
    acceptedProposals: number;
    vehicleSales: {
      revenue: number;
      cost: number;
      profit: number;
      soldWithPrice: number;
    };
  };
  global?: {
    companies: number;
    billing: {
      mrr: number;
      total: number;
      activeSubscriptions: number;
      byPlan: BillingPlanRow[];
    };
    totals: DashboardCounts;
  };
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(user: AuthenticatedUser): Promise<DashboardData> {
    if (user.role === Role.SUPER_ADMIN) {
      return this.getSuperAdminDashboard();
    }

    const companyId = user.companyId;
    if (!companyId) {
      throw new ForbiddenException('Usuário sem empresa vinculada');
    }

    const [counts, charts, revenue] = await Promise.all([
      this.getCompanyCounts(companyId),
      this.getCompanyCharts(companyId),
      this.getCompanyRevenue(companyId),
    ]);

    return { counts, charts, revenue };
  }

  private async getSuperAdminDashboard(): Promise<DashboardData> {
    const [companyCount, subscribed, counts, charts, revenue] =
      await Promise.all([
        this.prisma.company.count(),
        this.prisma.company.findMany({
          where: { planId: { not: null } },
          select: {
            planId: true,
            plan: { select: { id: true, name: true, priceMonthly: true } },
          },
        }),
        this.getCompanyCounts(),
        this.getCompanyCharts(),
        this.getCompanyRevenue(),
      ]);

    const planMap = new Map<string, BillingPlanRow>();
    for (const company of subscribed) {
      if (!company.plan || !company.planId) continue;
      const current = planMap.get(company.planId);
      if (current) {
        current.count += 1;
        current.mrr += company.plan.priceMonthly;
      } else {
        planMap.set(company.planId, {
          planId: company.planId,
          name: company.plan.name,
          priceMonthly: company.plan.priceMonthly,
          count: 1,
          mrr: company.plan.priceMonthly,
        });
      }
    }

    const byPlan = Array.from(planMap.values()).sort((a, b) => b.mrr - a.mrr);
    const mrr = byPlan.reduce((sum, row) => sum + row.mrr, 0);

    return {
      counts,
      charts,
      revenue,
      global: {
        companies: companyCount,
        billing: {
          mrr,
          total: companyCount,
          activeSubscriptions: subscribed.length,
          byPlan,
        },
        totals: counts,
      },
    };
  }

  private async getCompanyCounts(
    companyId?: string,
  ): Promise<DashboardCounts> {
    const where = companyId ? { companyId } : {};

    const [
      vehicleTotal,
      vehicleAvailable,
      vehicleSold,
      vehicleReserved,
      vehicleMaintenance,
      customers,
      users,
      sellers,
      proposals,
      schedules,
      leadGroups,
    ] = await Promise.all([
      this.prisma.vehicle.count({ where }),
      this.prisma.vehicle.count({
        where: { ...where, status: VehicleStatus.AVAILABLE },
      }),
      this.prisma.vehicle.count({
        where: { ...where, status: VehicleStatus.SOLD },
      }),
      this.prisma.vehicle.count({
        where: { ...where, status: VehicleStatus.RESERVED },
      }),
      this.prisma.vehicle.count({
        where: { ...where, status: VehicleStatus.MAINTENANCE },
      }),
      this.prisma.customer.count({ where }),
      this.prisma.user.count({ where }),
      this.prisma.seller.count({ where }),
      this.prisma.proposal.count({ where }),
      this.prisma.schedule.count({ where }),
      this.prisma.lead.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
    ]);

    const leads = Object.values(LeadStatus).reduce(
      (acc, status) => {
        acc[status] =
          leadGroups.find((group) => group.status === status)?._count.status ??
          0;
        return acc;
      },
      {} as Record<LeadStatus, number>,
    );

    return {
      vehicles: {
        total: vehicleTotal,
        available: vehicleAvailable,
        sold: vehicleSold,
        reserved: vehicleReserved,
        maintenance: vehicleMaintenance,
      },
      customers,
      users,
      sellers,
      proposals,
      schedules,
      leads,
    };
  }

  private async getCompanyCharts(
    companyId?: string,
  ): Promise<DashboardCharts> {
    const where = companyId ? { companyId } : {};
    const sixMonthsAgo = this.getMonthsAgo(5);

    const [vehicles, leadGroups, vehicleGroups, acceptedProposals] =
      await Promise.all([
        this.prisma.vehicle.findMany({
          where: {
            ...where,
            createdAt: { gte: sixMonthsAgo },
          },
          select: { createdAt: true },
        }),
        this.prisma.lead.groupBy({
          by: ['status'],
          where,
          _count: { status: true },
        }),
        this.prisma.vehicle.groupBy({
          by: ['status'],
          where,
          _count: { status: true },
        }),
        this.prisma.proposal.findMany({
          where: {
            ...where,
            status: ProposalStatus.ACCEPTED,
            createdAt: { gte: sixMonthsAgo },
          },
          select: { value: true, createdAt: true },
        }),
      ]);

    const monthLabels = this.getLastSixMonthLabels();
    const vehiclesByMonthMap = new Map<string, number>(
      monthLabels.map((month) => [month, 0]),
    );

    for (const vehicle of vehicles) {
      const month = this.formatMonth(vehicle.createdAt);
      if (vehiclesByMonthMap.has(month)) {
        vehiclesByMonthMap.set(month, (vehiclesByMonthMap.get(month) ?? 0) + 1);
      }
    }

    const revenueByMonthMap = new Map<string, number>(
      monthLabels.map((month) => [month, 0]),
    );

    for (const proposal of acceptedProposals) {
      const month = this.formatMonth(proposal.createdAt);
      if (revenueByMonthMap.has(month)) {
        revenueByMonthMap.set(
          month,
          (revenueByMonthMap.get(month) ?? 0) + proposal.value,
        );
      }
    }

    return {
      vehiclesByMonth: monthLabels.map((month) => ({
        month,
        count: vehiclesByMonthMap.get(month) ?? 0,
      })),
      leadsByStatus: Object.values(LeadStatus).map((status) => ({
        status,
        count:
          leadGroups.find((group) => group.status === status)?._count.status ??
          0,
      })),
      vehiclesByStatus: Object.values(VehicleStatus).map((status) => ({
        status,
        count:
          vehicleGroups.find((group) => group.status === status)?._count
            .status ?? 0,
      })),
      revenueByMonth: monthLabels.map((month) => ({
        month,
        total: revenueByMonthMap.get(month) ?? 0,
      })),
    };
  }

  private async getCompanyRevenue(companyId?: string): Promise<{
    total: number;
    acceptedProposals: number;
    vehicleSales: {
      revenue: number;
      cost: number;
      profit: number;
      soldWithPrice: number;
    };
  }> {
    const where = companyId ? { companyId } : {};

    const [aggregate, acceptedProposals, soldVehicles] = await Promise.all([
      this.prisma.proposal.aggregate({
        where: { ...where, status: ProposalStatus.ACCEPTED },
        _sum: { value: true },
      }),
      this.prisma.proposal.count({
        where: { ...where, status: ProposalStatus.ACCEPTED },
      }),
      this.prisma.vehicle.findMany({
        where: { ...where, status: VehicleStatus.SOLD, soldPrice: { not: null } },
        select: { purchasePrice: true, soldPrice: true },
      }),
    ]);

    let revenue = 0;
    let cost = 0;
    for (const vehicle of soldVehicles) {
      const sold = Number(vehicle.soldPrice ?? 0);
      revenue += sold;
      if (vehicle.purchasePrice != null) {
        cost += Number(vehicle.purchasePrice);
      }
    }

    return {
      total: aggregate._sum.value ?? 0,
      acceptedProposals,
      vehicleSales: {
        revenue,
        cost,
        profit: revenue - cost,
        soldWithPrice: soldVehicles.length,
      },
    };
  }

  private getMonthsAgo(monthsBack: number): Date {
    const date = new Date();
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    date.setMonth(date.getMonth() - monthsBack);
    return date;
  }

  private getLastSixMonthLabels(): string[] {
    const labels: string[] = [];
    const date = new Date();
    date.setDate(1);

    for (let i = 5; i >= 0; i -= 1) {
      const monthDate = new Date(date);
      monthDate.setMonth(date.getMonth() - i);
      labels.push(this.formatMonth(monthDate));
    }

    return labels;
  }

  private formatMonth(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
}
