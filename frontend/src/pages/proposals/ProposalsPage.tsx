import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileText, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
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
import { proposalsService } from "@/services/proposals.service";
import { customersService } from "@/services/customers.service";
import { vehiclesService } from "@/services/vehicles.service";
import { getApiErrorMessage } from "@/services/api";
import { useDebounce } from "@/hooks/useDebounce";
import { useCompany } from "@/hooks/useCompany";
import { formatCurrency, formatDate } from "@/lib/utils";
import { proposalStatusLabels, proposalStatusVariant } from "@/utils/labels";
import type { Proposal, ProposalStatus } from "@/types";

const schema = z.object({
  vehicleId: z.string().min(1, "Selecione um veículo"),
  customerId: z.string().min(1, "Selecione um cliente"),
  value: z.coerce.number().min(0, "Valor inválido"),
  status: z.enum(["PENDING", "ACCEPTED", "REJECTED", "CANCELLED"]),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function ProposalFormDialog({
  open,
  onOpenChange,
  proposal,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposal?: Proposal | null;
}) {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const isEditing = !!proposal;

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
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { status: "PENDING" } });

  React.useEffect(() => {
    if (open) {
      reset({
        vehicleId: proposal?.vehicleId ?? "",
        customerId: proposal?.customerId ?? "",
        value: proposal?.value ?? 0,
        status: proposal?.status ?? "PENDING",
        notes: proposal?.notes ?? "",
      });
    }
  }, [open, proposal, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      isEditing
        ? proposalsService.update(proposal!.id, values, companyId)
        : proposalsService.create(values, companyId),
    onSuccess: () => {
      toast.success(isEditing ? "Proposta atualizada com sucesso" : "Proposta criada com sucesso");
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      onOpenChange(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar proposta" : "Nova proposta"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Atualize os dados da proposta." : "Registre uma nova proposta comercial."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Veículo</Label>
            <Select value={watch("vehicleId")} onValueChange={(v) => setValue("vehicleId", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o veículo" />
              </SelectTrigger>
              <SelectContent>
                {vehiclesData?.items.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.brand} {vehicle.model} - {formatCurrency(vehicle.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.vehicleId && <p className="text-xs text-destructive">{errors.vehicleId.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Cliente</Label>
            <Select value={watch("customerId")} onValueChange={(v) => setValue("customerId", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {customersData?.items.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.customerId && <p className="text-xs text-destructive">{errors.customerId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="value">Valor (R$)</Label>
              <Input id="value" type="number" step="0.01" {...register("value")} />
              {errors.value && <p className="text-xs text-destructive">{errors.value.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={watch("status")} onValueChange={(v) => setValue("status", v as ProposalStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(proposalStatusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" {...register("notes")} placeholder="Condições de pagamento, entrada, etc." rows={3} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              {isEditing ? "Salvar alterações" : "Criar proposta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ProposalsPage() {
  const { companyId } = useCompany();
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const debouncedSearch = useDebounce(search);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Proposal | null>(null);
  const [deleting, setDeleting] = React.useState<Proposal | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["proposals", { page, search: debouncedSearch, companyId }],
    queryFn: () => proposalsService.list({ page, limit: 10, search: debouncedSearch, companyId }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => proposalsService.remove(id, companyId),
    onSuccess: () => {
      toast.success("Proposta removida");
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      setDeleting(null);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const columns: DataTableColumn<Proposal>[] = [
    {
      key: "vehicle",
      header: "Veículo",
      cell: (row) => (
        <div>
          <p className="font-medium text-foreground">
            {row.vehicle.brand} {row.vehicle.model}
          </p>
          <p className="text-xs text-muted-foreground">{row.vehicle.year}</p>
        </div>
      ),
    },
    { key: "customer", header: "Cliente", cell: (row) => <span>{row.customer.name}</span> },
    { key: "value", header: "Valor", cell: (row) => <span className="font-medium">{formatCurrency(row.value)}</span> },
    {
      key: "status",
      header: "Status",
      cell: (row) => <Badge variant={proposalStatusVariant[row.status]}>{proposalStatusLabels[row.status]}</Badge>,
    },
    { key: "seller", header: "Vendedor", cell: (row) => <span className="text-muted-foreground">{row.seller?.name ?? "-"}</span> },
    { key: "createdAt", header: "Data", cell: (row) => <span className="text-muted-foreground">{formatDate(row.createdAt)}</span> },
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
        title="Propostas"
        description="Acompanhe as propostas comerciais em andamento"
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus /> Nova proposta
          </Button>
        }
      />

      <div className="mb-4">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Buscar por cliente ou veículo..." />
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        keyExtractor={(row) => row.id}
        onRowClick={(row) => {
          setEditing(row);
          setFormOpen(true);
        }}
        emptyTitle="Nenhuma proposta encontrada"
        emptyDescription="Registre a primeira proposta comercial."
        emptyAction={
          <Button
            variant="outline"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <FileText /> Criar proposta
          </Button>
        }
      />

      {data && <Pagination meta={data.meta} onPageChange={setPage} />}

      <ProposalFormDialog open={formOpen} onOpenChange={setFormOpen} proposal={editing} />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Remover proposta?"
        description="Esta ação é irreversível."
        loading={removeMutation.isPending}
        onConfirm={() => deleting && removeMutation.mutate(deleting.id)}
      />
    </div>
  );
}
