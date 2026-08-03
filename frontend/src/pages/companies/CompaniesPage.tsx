import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Ban, Building2, CheckCircle2, CreditCard, KeyRound, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { companiesService } from "@/services/companies.service";
import { getApiErrorMessage } from "@/services/api";
import { useDebounce } from "@/hooks/useDebounce";
import { companyStatusLabels, companyStatusVariant } from "@/utils/labels";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CompanyFormDialog, PasswordLinkDialog } from "./CompanyFormDialog";
import { ChangePlanDialog } from "./ChangePlanDialog";
import type { Company } from "@/types";

export function CompaniesPage() {
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const debouncedSearch = useDebounce(search);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Company | null>(null);
  const [deleting, setDeleting] = React.useState<Company | null>(null);
  const [planCompany, setPlanCompany] = React.useState<Company | null>(null);
  const [passwordLink, setPasswordLink] = React.useState<{ url: string; adminEmail: string } | null>(null);

  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ["companies-stats"],
    queryFn: companiesService.getStatsOverview,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["companies", { page, search: debouncedSearch }],
    queryFn: () => companiesService.list({ page, limit: 10, search: debouncedSearch }),
  });

  const blockMutation = useMutation({
    mutationFn: (id: string) => companiesService.block(id),
    onSuccess: () => {
      toast.success("Cliente bloqueado");
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => companiesService.activate(id),
    onSuccess: () => {
      toast.success("Cliente ativado");
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => companiesService.remove(id),
    onSuccess: () => {
      toast.success("Cliente removido");
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      setDeleting(null);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const linkMutation = useMutation({
    mutationFn: (id: string) => companiesService.createPasswordChangeLink(id),
    onSuccess: (data) => {
      setPasswordLink({ url: data.url, adminEmail: data.adminEmail });
      toast.success("Link gerado");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const columns: DataTableColumn<Company>[] = [
    {
      key: "name",
      header: "Cliente",
      cell: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.email}</p>
        </div>
      ),
    },
    { key: "slug", header: "Slug", cell: (row) => <span className="text-muted-foreground">/{row.slug}</span> },
    {
      key: "plan",
      header: "Plano",
      cell: (row) => (
        <div>
          <Badge variant="outline">{row.plan?.name ?? "Sem plano"}</Badge>
          {row.plan && (
            <p className="mt-1 text-xs text-muted-foreground">{formatCurrency(row.plan.priceMonthly)}/mês</p>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <Badge variant={companyStatusVariant[row.status]}>{companyStatusLabels[row.status]}</Badge>,
    },
    {
      key: "createdAt",
      header: "Desde",
      cell: (row) => <span className="text-muted-foreground">{formatDate(row.createdAt)}</span>,
    },
    {
      key: "actions",
      header: "",
      headerClassName: "w-12",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setEditing(row);
                setFormOpen(true);
              }}
            >
              <Pencil /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPlanCompany(row)}>
              <CreditCard /> Alterar plano
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => linkMutation.mutate(row.id)}>
              <KeyRound /> Link alterar senha
            </DropdownMenuItem>
            {row.status === "ACTIVE" ? (
              <DropdownMenuItem onClick={() => blockMutation.mutate(row.id)}>
                <Ban /> Bloquear
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => activateMutation.mutate(row.id)}>
                <CheckCircle2 /> Ativar
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onClick={() => setDeleting(row)}>
              <Trash2 /> Remover
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Lojas e concessionárias que usam a plataforma (seus clientes SaaS)"
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus /> Novo cliente
          </Button>
        }
      />

      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="font-display text-lg font-bold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          {Object.entries(stats.byStatus).map(([status, count]) => (
            <Card key={status}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{companyStatusLabels[status as keyof typeof companyStatusLabels]}</p>
                <p className="font-display text-lg font-bold">{count}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mb-4">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Buscar por nome, e-mail ou slug..." />
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        keyExtractor={(row) => row.id}
        emptyTitle="Nenhum cliente encontrado"
        emptyDescription="Cadastre o primeiro cliente (loja/concessionária) para começar."
      />

      {data && <Pagination meta={data.meta} onPageChange={setPage} />}

      <CompanyFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        company={editing}
        onCreatedLink={(payload) => setPasswordLink(payload)}
      />

      <PasswordLinkDialog
        open={!!passwordLink}
        onOpenChange={(open) => !open && setPasswordLink(null)}
        url={passwordLink?.url ?? ""}
        adminEmail={passwordLink?.adminEmail}
      />

      <ChangePlanDialog
        open={!!planCompany}
        onOpenChange={(open) => !open && setPlanCompany(null)}
        company={planCompany}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Remover ${deleting?.name}?`}
        description="Esta ação é irreversível e removerá todos os dados relacionados a este cliente."
        loading={removeMutation.isPending}
        onConfirm={() => deleting && removeMutation.mutate(deleting.id)}
      />
    </div>
  );
}
