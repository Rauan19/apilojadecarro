import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Building2, Car, CreditCard, DollarSign, FileText, Target, Users2 } from "lucide-react";
import { dashboardService } from "@/services/dashboard.service";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { CardSkeleton } from "@/components/shared/LoadingPage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { leadStatusLabels, vehicleStatusLabels } from "@/utils/labels";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

function formatMonthLabel(month: string) {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1);
  return date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
}

export function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: dashboardService.get,
  });

  if (isLoading || !data) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Visão geral da sua operação" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const { counts, charts, revenue, global } = data;

  const vehiclesByStatusData = charts.vehiclesByStatus.map((item) => ({
    name: vehicleStatusLabels[item.status],
    value: item.count,
  }));

  const leadsByStatusData = charts.leadsByStatus.map((item) => ({
    name: leadStatusLabels[item.status],
    value: item.count,
  }));

  const vehiclesByMonthData = charts.vehiclesByMonth.map((item) => ({
    month: formatMonthLabel(item.month),
    veiculos: item.count,
  }));

  const revenueByMonthData = charts.revenueByMonth.map((item) => ({
    month: formatMonthLabel(item.month),
    receita: item.total,
  }));

  const mrr = global?.billing.mrr ?? 0;
  const planEntries = global?.billing.byPlan ?? [];

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {global && (
          <>
            <StatCard
              label="Faturamento mensal (MRR)"
              value={formatCurrency(mrr)}
              icon={DollarSign}
              accent="success"
            />
            <StatCard
              label="Assinaturas pagas"
              value={formatNumber(global.billing.activeSubscriptions)}
              icon={CreditCard}
              accent="primary"
            />
            <StatCard
              label="Clientes ativos"
              value={formatNumber(global.companies)}
              icon={Building2}
              accent="accent"
            />
          </>
        )}
        <StatCard
          label="Veículos em estoque"
          value={formatNumber(counts.vehicles.available)}
          icon={Car}
          accent="accent"
        />
        <StatCard
          label="Leads em aberto"
          value={formatNumber(counts.leads.NEW + counts.leads.ATTENDING)}
          icon={Target}
          accent="warning"
        />
        <StatCard label="Propostas" value={formatNumber(counts.proposals)} icon={FileText} accent="primary" />
        {!global && (
          <>
            <StatCard label="Clientes" value={formatNumber(counts.customers)} icon={Users2} accent="accent" />
            <StatCard
              label="Receita (propostas aceitas)"
              value={formatCurrency(revenue.total)}
              icon={DollarSign}
              accent="success"
            />
            <StatCard label="Veículos vendidos" value={formatNumber(counts.vehicles.sold)} icon={Car} accent="secondary" />
            <StatCard label="Vendedores ativos" value={formatNumber(counts.sellers)} icon={Users2} accent="primary" />
          </>
        )}
      </div>

      {global && (
        <Card className="mt-4 overflow-hidden">
          <CardHeader className="border-b border-border bg-white">
            <CardTitle>Faturamento por plano</CardTitle>
            <CardDescription>
              MRR estimado com base nos planos atribuídos a cada loja. Ano projetado:{" "}
              <span className="font-semibold text-foreground">{formatCurrency(mrr * 12)}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-3">
              {planEntries.map((item) => (
                <div key={item.planId} className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{item.name}</p>
                    <Badge variant="outline">{item.count}</Badge>
                  </div>
                  <p className="mt-3 text-2xl font-semibold tracking-tight text-primary">
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
          </CardContent>
        </Card>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Veículos cadastrados (últimos 6 meses)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vehiclesByMonthData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis tickLine={false} axisLine={false} className="text-xs" allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))" }}
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="veiculos" name="Veículos" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Veículos por status</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vehiclesByStatusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {vehiclesByStatusData.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leads por status</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadsByStatusData} layout="vertical" margin={{ left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} className="text-xs" allowDecimals={false} />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={110} className="text-xs" />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))" }}
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" name="Leads" fill="hsl(var(--chart-2))" radius={[0, 6, 6, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{global ? "Receita de propostas (rede)" : "Receita de propostas aceitas"}</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueByMonthData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                  tickFormatter={(value) => formatCurrency(value).replace(",00", "")}
                  width={80}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value ?? 0))}
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="receita"
                  name="Receita"
                  stroke="hsl(var(--chart-3))"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
