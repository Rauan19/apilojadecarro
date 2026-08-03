import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Plus, Target, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { leadsService } from "@/services/leads.service";
import { customersService } from "@/services/customers.service";
import { vehiclesService } from "@/services/vehicles.service";
import { getApiErrorMessage } from "@/services/api";
import { useDebounce } from "@/hooks/useDebounce";
import { useCompany } from "@/hooks/useCompany";
import { useAuth } from "@/hooks/useAuth";
import { formatDateTime } from "@/lib/utils";
import { leadOriginLabels, leadStatusLabels, leadStatusVariant } from "@/utils/labels";
import type { Lead, LeadOrigin, LeadStatus } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Informe o nome"),
  phone: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  origin: z.enum(["WHATSAPP", "SITE", "MANUAL"]),
  status: z.enum(["NEW", "ATTENDING", "NEGOTIATION", "SALE", "LOST"]),
  notes: z.string().optional(),
  customerId: z.string().optional(),
  vehicleId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function LeadFormDialog({
  open,
  onOpenChange,
  lead,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
}) {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const isEditing = !!lead;

  const { data: customersData } = useQuery({
    queryKey: ["customers-picker", companyId],
    queryFn: () => customersService.list({ page: 1, limit: 100, companyId }),
    enabled: open,
  });

  const { data: vehiclesData } = useQuery({
    queryKey: ["vehicles-picker", companyId],
    queryFn: () => vehiclesService.list({ page: 1, limit: 100, companyId }),
    enabled: open,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { origin: "MANUAL", status: "NEW" },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        name: lead?.name ?? "",
        phone: lead?.phone ?? "",
        email: lead?.email ?? "",
        origin: lead?.origin ?? "MANUAL",
        status: lead?.status ?? "NEW",
        notes: lead?.notes ?? "",
        customerId: lead?.customerId ?? undefined,
        vehicleId: lead?.vehicleId ?? undefined,
      });
    }
  }, [open, lead, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      isEditing ? leadsService.update(lead!.id, values, companyId) : leadsService.create(values, companyId),
    onSuccess: () => {
      toast.success(isEditing ? "Lead atualizado com sucesso" : "Lead criado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      onOpenChange(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar lead" : "Novo lead"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Atualize as informações do lead." : "Cadastre uma nova oportunidade de venda."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" {...register("name")} placeholder="Nome do contato" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" {...register("phone")} placeholder="(11) 99999-9999" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Origem</Label>
              <Select value={watch("origin")} onValueChange={(v) => setValue("origin", v as LeadOrigin)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(leadOriginLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={watch("status")} onValueChange={(v) => setValue("status", v as LeadStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(leadStatusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Cliente vinculado</Label>
            <Select value={watch("customerId")} onValueChange={(v) => setValue("customerId", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Nenhum" />
              </SelectTrigger>
              <SelectContent>
                {customersData?.items.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Veículo de interesse</Label>
            <Select value={watch("vehicleId")} onValueChange={(v) => setValue("vehicleId", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Nenhum" />
              </SelectTrigger>
              <SelectContent>
                {vehiclesData?.items.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.brand} {vehicle.model} ({vehicle.year})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" {...register("notes")} rows={3} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              {isEditing ? "Salvar alterações" : "Criar lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function LeadsPage() {
  const { companyId } = useCompany();
  const { user } = useAuth();
  const canManage = user?.role !== "SELLER";
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const debouncedSearch = useDebounce(search);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Lead | null>(null);
  const [deleting, setDeleting] = React.useState<Lead | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["leads", { page, search: debouncedSearch, companyId }],
    queryFn: () => leadsService.list({ page, limit: 10, search: debouncedSearch, companyId }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) => leadsService.updateStatus(id, status, companyId),
    onSuccess: () => {
      toast.success("Status atualizado");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => leadsService.remove(id, companyId),
    onSuccess: () => {
      toast.success("Lead removido");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setDeleting(null);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const columns: DataTableColumn<Lead>[] = [
    {
      key: "name",
      header: "Lead",
      cell: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.email ?? row.phone ?? "-"}</p>
        </div>
      ),
    },
    {
      key: "vehicle",
      header: "Veículo",
      cell: (row) => (
        <span className="text-muted-foreground">
          {row.vehicle ? `${row.vehicle.brand} ${row.vehicle.model}` : "-"}
        </span>
      ),
    },
    {
      key: "origin",
      header: "Origem",
      cell: (row) => <Badge variant="outline">{leadOriginLabels[row.origin]}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      cell: (row) =>
        canManage ? (
          <Select
            value={row.status}
            onValueChange={(value) => statusMutation.mutate({ id: row.id, status: value as LeadStatus })}
          >
            <SelectTrigger className="h-8 w-40" onClick={(e) => e.stopPropagation()}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(leadStatusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Badge variant={leadStatusVariant[row.status]}>{leadStatusLabels[row.status]}</Badge>
        ),
    },
    {
      key: "seller",
      header: "Vendedor",
      cell: (row) => <span className="text-muted-foreground">{row.seller?.name ?? "-"}</span>,
    },
    {
      key: "createdAt",
      header: "Criado em",
      cell: (row) => <span className="text-muted-foreground">{formatDateTime(row.createdAt)}</span>,
    },
    ...(canManage
      ? [
          {
            key: "actions",
            header: "",
            headerClassName: "w-12",
            cell: (row: Lead) => (
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem destructive onClick={() => setDeleting(row)}>
                    <Trash2 /> Remover
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Acompanhe o funil de oportunidades de venda"
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus /> Novo lead
          </Button>
        }
      />

      <div className="mb-4">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Buscar por nome, e-mail ou telefone..." />
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        keyExtractor={(row) => row.id}
        emptyTitle="Nenhum lead encontrado"
        emptyDescription="Novos leads aparecerão aqui assim que forem cadastrados."
        emptyAction={
          <Button
            variant="outline"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Target /> Criar primeiro lead
          </Button>
        }
      />

      {data && <Pagination meta={data.meta} onPageChange={setPage} />}

      <LeadFormDialog open={formOpen} onOpenChange={setFormOpen} lead={editing} />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Remover lead de ${deleting?.name}?`}
        description="Esta ação é irreversível."
        loading={removeMutation.isPending}
        onConfirm={() => deleting && removeMutation.mutate(deleting.id)}
      />
    </div>
  );
}
