import { type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { dashboardService } from "@/services/dashboard.service";
import { StockLot } from "@/components/dashboard/StockLot";
import { useAuth } from "@/hooks/useAuth";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { leadStatusLabels } from "@/utils/labels";

function formatMonthLabel(month: string) {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1);
  return date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
}

function todayLabel() {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

const tooltipStyle = {
  backgroundColor: "#12141A",
  border: "none",
  borderRadius: 8,
  fontSize: 12,
  color: "#fff",
  boxShadow: "0 12px 28px -14px rgb(0 0 0 / 0.45)",
};

function Metric({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 px-1 py-1 sm:px-2", className)}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1.5 font-display text-3xl font-bold tracking-tight text-foreground tabular-nums sm:text-[2.35rem] sm:leading-none">
        {value}
      </p>
      {hint && <p className="mt-2 text-xs leading-snug text-muted-foreground">{hint}</p>}
    </div>
  );
}

function BoardSection({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("min-w-0", className)}>
      <div className="mb-5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function MonthBars({
  data,
  max,
}: {
  data: { month: string; value: number }[];
  max: number;
}) {
  const peak = Math.max(max, 1);
  return (
    <div className="flex h-52 items-end gap-2 sm:gap-3">
      {data.map((item) => {
        const height = Math.max((item.value / peak) * 100, item.value > 0 ? 6 : 0);
        return (
          <div key={item.month} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <span className="font-display text-xs font-bold tabular-nums text-foreground">
              {item.value > 0 ? item.value : ""}
            </span>
            <div className="relative flex h-40 w-full items-end justify-center rounded-sm bg-secondary/50">
              <div
                className="w-full rounded-sm bg-primary transition-[height] duration-500"
                style={{ height: `${height}%` }}
              />
            </div>
            <span className="text-[11px] capitalize text-muted-foreground">{item.month}</span>
          </div>
        );
      })}
    </div>
  );
}

function FunnelRows({ data }: { data: { name: string; value: number }[] }) {
  const peak = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-4">
      {data.map((item, index) => {
        const width = Math.max((item.value / peak) * 100, item.value > 0 ? 4 : 0);
        return (
          <div key={item.name}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <p className="truncate text-sm text-foreground">{item.name}</p>
              <p className="font-display text-lg font-bold tabular-nums text-foreground">{item.value}</p>
            </div>
            <div className="h-2 overflow-hidden rounded-sm bg-secondary">
              <div
                className={cn(
                  "h-full rounded-sm transition-[width] duration-500",
                  index === 0 ? "bg-primary" : "bg-[#12141A]",
                )}
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: dashboardService.get,
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="h-40 animate-pulse rounded-2xl bg-muted/60" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted/50" />
          ))}
        </div>
      </div>
    );
  }

  const { counts, charts, revenue, global } = data;
  const firstName = user?.name?.trim().split(/\s+/)[0] || "aí";

  const vehiclesByMonthData = charts.vehiclesByMonth.map((item) => ({
    month: formatMonthLabel(item.month),
    value: item.count,
  }));

  const leadsByStatusData = charts.leadsByStatus.map((item) => ({
    name: leadStatusLabels[item.status],
    value: item.count,
  }));

  const revenueByMonthData = charts.revenueByMonth.map((item) => ({
    month: formatMonthLabel(item.month),
    receita: item.total,
  }));

  const maxVehicleMonth = Math.max(...vehiclesByMonthData.map((d) => d.value), 0);
  const revenuePeak = Math.max(...revenueByMonthData.map((d) => d.receita), 0);

  const mrr = global?.billing.mrr ?? 0;
  const planEntries = global?.billing.byPlan ?? [];
  const openLeads = counts.leads.NEW + counts.leads.ATTENDING;
  const totalLeads = Object.values(counts.leads).reduce((sum, n) => sum + n, 0);

  const stockSegments = [
    { key: "available", label: "Disponível", count: counts.vehicles.available, tone: "primary" as const },
    { key: "reserved", label: "Reservado", count: counts.vehicles.reserved, tone: "warning" as const },
    { key: "sold", label: "Vendido", count: counts.vehicles.sold, tone: "success" as const },
    { key: "maintenance", label: "Manutenção", count: counts.vehicles.maintenance, tone: "destructive" as const },
  ];

  const heroValue = global
    ? formatNumber(global.billing.activeSubscriptions)
    : formatNumber(counts.vehicles.available);
  const heroLabel = global ? "Assinaturas ativas" : "Veículos no pátio";
  const heroHint = global
    ? `de ${formatNumber(global.companies)} lojas na rede`
    : `${formatNumber(counts.vehicles.total)} no estoque total`;

  return (
    <div className="dashboard-board space-y-6 sm:space-y-8">
      {/* Manhã na loja — board escuro com faixa da marca */}
      <header className="dashboard-hero relative overflow-hidden rounded-2xl bg-[#12141A] text-white">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-primary" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(ellipse 70% 80% at 92% -10%, rgba(227,28,35,0.38), transparent 52%), linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 42%)",
          }}
        />
        <div className="relative flex flex-col gap-8 px-5 py-7 pl-6 sm:px-8 sm:py-9 sm:pl-9 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="text-sm capitalize text-white/50">{todayLabel()}</p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-[2.75rem] lg:leading-[1.08]">
              Bom dia, {firstName}.
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/60 sm:text-[15px]">
              {global
                ? "Visão da rede: assinaturas, MRR e saúde das lojas."
                : "O que importa hoje no pátio — estoque, leads e vendas."}
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link
                to="/veiculos"
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Ver estoque
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                to="/leads"
                className="inline-flex items-center gap-1.5 rounded-md border border-white/18 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/10"
              >
                Abrir leads
              </Link>
            </div>
          </div>

          <div className="shrink-0 border-t border-white/10 pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
            <p className="text-sm text-white/45">{heroLabel}</p>
            <p className="mt-1 font-display text-5xl font-bold tracking-tight tabular-nums sm:text-6xl lg:text-7xl">
              {heroValue}
            </p>
            <p className="mt-2 text-sm text-white/50">{heroHint}</p>
          </div>
        </div>
      </header>

      {/* Faixa de métricas — leitura tipográfica, sem ícones */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 border-y border-border/70 py-5 sm:gap-x-6 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-border/70 lg:py-6">
        {global ? (
          <>
            <Metric className="lg:px-5 lg:first:pl-0 lg:last:pr-0" label="MRR" value={formatCurrency(mrr)} hint="Faturamento mensal recorrente" />
            <Metric className="lg:px-5" label="Lojas" value={formatNumber(global.companies)} hint="Clientes ativos" />
            <Metric
              className="lg:px-5"
              label="Estoque na rede"
              value={formatNumber(counts.vehicles.available)}
              hint="Veículos disponíveis"
            />
            <Metric className="lg:px-5 lg:last:pr-0" label="Propostas" value={formatNumber(counts.proposals)} hint="Abertas na rede" />
          </>
        ) : (
          <>
            <Metric
              className="lg:px-5 lg:first:pl-0"
              label="Leads abertos"
              value={formatNumber(openLeads)}
              hint={totalLeads ? `${openLeads} de ${totalLeads} no funil` : "Nenhum lead ainda"}
            />
            <Metric
              className="lg:px-5"
              label="Receita propostas"
              value={formatCurrency(revenue.total)}
              hint="Propostas aceitas"
            />
            <Metric
              className="lg:px-5"
              label="Vendas"
              value={formatCurrency(revenue.vehicleSales?.revenue ?? 0)}
              hint={
                counts.vehicles.sold === 1
                  ? "1 veículo vendido"
                  : `${formatNumber(counts.vehicles.sold)} veículos vendidos`
              }
            />
            <Metric
              className="lg:px-5"
              label="Lucro"
              value={formatCurrency(revenue.vehicleSales?.profit ?? 0)}
              hint="Compra × venda"
            />
          </>
        )}
      </div>

      {global && planEntries.length > 0 && (
        <BoardSection title="Faturamento por plano" subtitle={`Projeção anual ${formatCurrency(mrr * 12)}`}>
          <div className="grid gap-6 border-t border-border/70 pt-5 sm:grid-cols-2 lg:grid-cols-3">
            {planEntries.map((item) => (
              <div key={item.planId} className="min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate font-medium text-foreground">{item.name}</p>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {item.count} lojas
                  </span>
                </div>
                <p className="mt-2 font-display text-3xl font-bold tracking-tight text-primary tabular-nums">
                  {formatCurrency(item.mrr)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatCurrency(item.priceMonthly)} / mês cada
                </p>
              </div>
            ))}
          </div>
        </BoardSection>
      )}

      <BoardSection
        title="Composição do estoque"
        subtitle="Como o pátio está dividido agora"
        action={
          <Link
            to="/veiculos"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            Gerenciar
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        }
      >
        <StockLot segments={stockSegments} />
      </BoardSection>

      <div className="grid grid-cols-1 gap-10 border-t border-border/70 pt-8 lg:grid-cols-2 lg:gap-12">
        <BoardSection title="Entradas no estoque" subtitle="Últimos 6 meses">
          <MonthBars data={vehiclesByMonthData} max={maxVehicleMonth} />
        </BoardSection>

        <BoardSection title="Funil de leads" subtitle="Por etapa agora">
          <FunnelRows data={leadsByStatusData} />
        </BoardSection>
      </div>

      <BoardSection
        title={global ? "Receita de propostas (rede)" : "Receita de propostas"}
        subtitle={
          revenuePeak > 0
            ? `Pico no período: ${formatCurrency(revenuePeak)}`
            : "Sem receita registrada no período"
        }
        className="border-t border-border/70 pt-8"
      >
        <div className="h-56 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueByMonthData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={72}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickFormatter={(value) => formatCurrency(value).replace(",00", "")}
              />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value ?? 0))}
                contentStyle={tooltipStyle}
                itemStyle={{ color: "#fff" }}
                labelStyle={{ color: "rgba(255,255,255,0.65)" }}
              />
              <Area
                type="monotone"
                dataKey="receita"
                name="Receita"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                fill="url(#revenueFill)"
                dot={{ r: 3, strokeWidth: 0, fill: "hsl(var(--primary))" }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </BoardSection>
    </div>
  );
}
