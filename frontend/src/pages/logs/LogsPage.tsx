import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollText } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { logsService } from "@/services/logs.service";
import { companiesService } from "@/services/companies.service";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDateTime } from "@/lib/utils";
import type { ApiLog } from "@/types";

function statusVariant(code: number | null): "success" | "warning" | "destructive" | "secondary" {
  if (code == null) return "secondary";
  if (code >= 200 && code < 300) return "success";
  if (code >= 400 && code < 500) return "warning";
  if (code >= 500) return "destructive";
  return "secondary";
}

function methodVariant(method: string): "outline" | "secondary" | "default" {
  const m = method.toUpperCase();
  if (m === "GET") return "outline";
  if (m === "POST") return "default";
  return "secondary";
}

export function LogsPage() {
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [companyId, setCompanyId] = React.useState<string>("all");
  const debouncedSearch = useDebounce(search);

  const { data: companiesData } = useQuery({
    queryKey: ["companies-picker-all"],
    queryFn: () => companiesService.list({ page: 1, limit: 100 }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["api-logs", { page, search: debouncedSearch, companyId }],
    queryFn: () =>
      logsService.listApiLogs({
        page,
        limit: 15,
        search: debouncedSearch || undefined,
        companyId: companyId !== "all" ? companyId : undefined,
      }),
  });

  const columns: DataTableColumn<ApiLog>[] = [
    {
      key: "createdAt",
      header: "Data",
      cell: (row) => <span className="whitespace-nowrap text-muted-foreground">{formatDateTime(row.createdAt)}</span>,
    },
    {
      key: "method",
      header: "Método",
      cell: (row) => <Badge variant={methodVariant(row.method)}>{row.method}</Badge>,
    },
    {
      key: "endpoint",
      header: "Endpoint",
      cell: (row) => <code className="text-xs">{row.endpoint}</code>,
    },
    {
      key: "statusCode",
      header: "Status",
      cell: (row) => (
        <Badge variant={statusVariant(row.statusCode)}>{row.statusCode ?? "—"}</Badge>
      ),
    },
    {
      key: "responseTime",
      header: "Tempo",
      cell: (row) => (
        <span className="text-muted-foreground">
          {row.responseTime != null ? `${row.responseTime} ms` : "—"}
        </span>
      ),
    },
    {
      key: "ip",
      header: "IP",
      cell: (row) => <span className="font-mono text-xs text-muted-foreground">{row.ip ?? "—"}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Logs de API"
        description="Acompanhe as requisições feitas à API pública"
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Buscar por endpoint, método, IP..."
        />

        <div className="w-full max-w-xs">
          <Label className="mb-1.5 block text-xs text-muted-foreground">Cliente</Label>
          <Select
            value={companyId}
            onValueChange={(value) => {
              setCompanyId(value);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os clientes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os clientes</SelectItem>
              {companiesData?.items.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        keyExtractor={(row) => row.id}
        emptyTitle="Nenhum log encontrado"
        emptyDescription="As requisições à API pública aparecerão aqui assim que houver tráfego."
        emptyAction={
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ScrollText className="h-4 w-4" />
            Aguarde o uso dos tokens de integração
          </div>
        }
      />

      {data && <Pagination meta={data.meta} onPageChange={setPage} />}
    </div>
  );
}
