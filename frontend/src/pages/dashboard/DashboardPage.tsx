import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { dashboardService } from "@/services/dashboard.service";
import { PageHeader } from "@/components/layout/PageHeader";
import { PrimaryGauge, ReadoutRow } from "@/components/dashboard/Gauge";
import { TechPanel } from "@/components/dashboard/TechPanel";
import { StockLot } from "@/components/dashboard/StockLot";
import {
  IconCompanies,
  IconCustomers,
  IconLeads,
  IconProfit,
  IconProposal,
  IconRevenue,
  IconSellers,
  IconSubscription,
  IconVehicle,
} from "@/components/icons/instrument-icons";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { leadStatusLabels } from "@/utils/labels";

function formatMonthLabel(month: string) {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1);
  return date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
}

const tooltipStyle = {
  backgroundColor: "hsl(var(--popover))",
  borderColor: "hsl(var(--border))",
  borderRadius: 2,
  fontSize: 12,
};

export function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: dashboardService.get,
  });

  if (isLoading || !data) {
    return (
      <div>
        <PageHeader title="Início" description="Visão geral da sua operação" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse border border-border bg-muted/40" />
          ))}
        </div>
      </div>
    );
  }

  const { counts, charts, revenue, global } = data;

  const vehiclesByMonthData = charts.vehiclesByMonth.map((item) => ({
    month: formatMonthLabel(item.month),
    veiculos: item.count,
  }));

  const leadsByStatusData = charts.leadsByStatus.map((item) => ({
    name: leadStatusLabels[item.status],
    value: item.count,
  }));

  const revenueByMonthData = charts.revenueByMonth.map((item) => ({
    month: formatMonthLabel(item.month),
    receita: item.total,
  }));

  const mrr = global?.billing.mrr ?? 0;
  const planEntries = global?.billing.byPlan ?? [];

  const openLeads = counts.leads.NEW + counts.leads.ATTENDING;
  const totalLeads = Object.values(counts.leads).reduce((sum, n) => sum + n, 0);
  const totalVehicles = counts.vehicles.total || 1;

  const stockSegments = [
    { key: "available", label: "Disponível", count: counts.vehicles.available, tone: "primary" as const },
    { key: "reserved", label: "Reservado", count: counts.vehicles.reserved, tone: "warning" as const },
    { key: "sold", label: "Vendido", count: counts.vehicles.sold, tone: "success" as const },
    { key: "maintenance", label: "Manutenção", count: counts.vehicles.maintenance, tone: "destructive" as const },
  ];

  return (
    <div className="page-fade-in">
      <PageHeader
        title={`Olá, ${user?.name?.split(" ")[0] ?? ""}`}
        description={
          user?.role === "SUPER_ADMIN"
            ? "Acompanhe o faturamento da plataforma e a saúde dos clientes"
            : "Acompanhe os principais indicadores da sua loja"
        }
      />

      <div className="relative overflow-hidden border border-border bg-card">
        <span className="pointer-events-none absolute right-0 top-0 h-7 w-7 border-b border-l border-border/70" />
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr]">
          <div className="flex flex-col gap-6 border-border p-5 max-lg:border-b max-lg:flex-row max-lg:flex-wrap lg:border-r">
            {global ? (
              <PrimaryGauge
                label="Assinaturas pagas"
                value={formatNumber(global.billing.activeSubscriptions)}
                sublabel={`de ${formatNumber(global.companies)} lojas com assinatura ativa`}
                percent={global.companies ? (global.billing.activeSubscriptions / global.companies) * 100 : 0}
                icon={IconSubscription}
                tone="primary"
              />
            ) : (
              <PrimaryGauge
                label="Veículos em estoque"
                value={formatNumber(counts.vehicles.available)}
                sublabel={`${formatNumber(counts.vehicles.available)} disponíveis de ${formatNumber(counts.vehicles.total)} no total`}
                percent={(counts.vehicles.available / totalVehicles) * 100}
                icon={IconVehicle}
                tone="accent"
              />
            )}
            <PrimaryGauge
              label="Leads em aberto"
              value={formatNumber(openLeads)}
              sublabel={totalLeads ? `${openLeads} de ${totalLeads} no funil ativo` : "Nenhum lead ainda"}
              percent={totalLeads ? (openLeads / totalLeads) * 100 : 0}
              icon={IconLeads}
              tone="warning"
              size={116}
            />
          </div>

          <div className="grid grid-cols-1 divide-y divide-border px-5 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <div className="divide-y divide-border sm:pr-5">
              {global ? (
                <>
                  <ReadoutRow label="Faturamento mensal (MRR)" value={formatCurrency(mrr)} icon={IconRevenue} tone="success" />
                  <ReadoutRow label="Clientes ativos" value={formatNumber(global.companies)} icon={IconCompanies} tone="accent" />
                  <ReadoutRow label="Veículos em estoque" value={formatNumber(counts.vehicles.available)} icon={IconVehicle} tone="accent" />
                </>
              ) : (
                <>
                  <ReadoutRow label="Clientes" value={formatNumber(counts.customers)} icon={IconCustomers} tone="accent" />
                  <ReadoutRow label="Receita de propostas" value={formatCurrency(revenue.total)} icon={IconRevenue} tone="success" />
                  <ReadoutRow label="Faturamento em vendas" value={formatCurrency(revenue.vehicleSales?.revenue ?? 0)} icon={IconRevenue} tone="primary" />
                </>
              )}
            </div>
            <div className="divide-y divide-border sm:pl-5">
              <ReadoutRow label="Propostas" value={formatNumber(counts.proposals)} icon={IconProposal} tone="primary" />
              {!global && (
                <>
                  <ReadoutRow
                    label="Lucro (compra × venda)"
                    value={formatCurrency(revenue.vehicleSales?.profit ?? 0)}
                    icon={IconProfit}
                    tone={(revenue.vehicleSales?.profit ?? 0) >= 0 ? "success" : "warning"}
                  />
                  <ReadoutRow label="Veículos vendidos" value={formatNumber(counts.vehicles.sold)} icon={IconVehicle} tone="success" />
                  <ReadoutRow label="Vendedores ativos" value={formatNumber(counts.sellers)} icon={IconSellers} tone="primary" />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {global && (
        <TechPanel
          className="mt-3"
          title="Faturamento por plano"
          description={
            <>
              MRR estimado com base nos planos atribuídos. Ano projetado:{" "}
              <span className="font-semibold text-foreground">{formatCurrency(mrr * 12)}</span>
            </>
          }
          bodyClassName="p-0"
        >
          <div className="grid divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-3">
            {planEntries.map((item) => (
              <div key={item.planId} className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{item.name}</p>
                  <Badge variant="outline" className="rounded-none">
                    {item.count}
                  </Badge>
                </div>
                <p className="mt-3 font-display text-2xl font-bold tracking-tight text-primary tabular-nums">
                  {formatCurrency(item.mrr)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatCurrency(item.priceMonthly)} × {item.count} lojas
                </p>
              </div>
            ))}
            {planEntries.length === 0 && (
              <div className="p-5 text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
                Nenhum cliente com plano atribuído ainda.
              </div>
            )}
          </div>
        </TechPanel>
      )}

      <TechPanel className="mt-3" title="Composição do estoque" description="Distribuição atual por status">
        <StockLot segments={stockSegments} />
      </TechPanel>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <TechPanel title="Veículos cadastrados" description="Últimos 6 meses" bodyClassName="h-64 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={vehiclesByMonthData}>
              <CartesianGrid strokeDasharray="2 4" className="stroke-border" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs" />
              <YAxis tickLine={false} axisLine={false} className="text-xs" allowDecimals={false} width={28} />
              <Tooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={tooltipStyle} />
              <Bar dataKey="veiculos" name="Veículos" fill="hsl(var(--primary))" radius={0} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </TechPanel>

        <TechPanel title="Leads por etapa" description="Funil atual" bodyClassName="h-64 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={leadsByStatusData} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="2 4" className="stroke-border" horizontal={false} />
              <XAxis type="number" tickLine={false} axisLine={false} className="text-xs" allowDecimals={false} />
              <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={100} className="text-xs" />
              <Tooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={tooltipStyle} />
              <Bar dataKey="value" name="Leads" fill="hsl(var(--accent))" radius={0} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </TechPanel>

        <TechPanel
          className="lg:col-span-2"
          title={global ? "Receita de propostas (rede)" : "Receita de propostas aceitas"}
          bodyClassName="h-64 p-4"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueByMonthData}>
              <CartesianGrid strokeDasharray="2 4" className="stroke-border" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs" />
              <YAxis
                tickLine={false}
                axisLine={false}
                className="text-xs"
                tickFormatter={(value) => formatCurrency(value).replace(",00", "")}
                width={76}
              />
              <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} contentStyle={tooltipStyle} />
              <Line
                type="linear"
                dataKey="receita"
                name="Receita"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 0, fill: "hsl(var(--primary))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </TechPanel>
      </div>
    </div>
  );
}
