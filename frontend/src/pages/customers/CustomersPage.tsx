import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { customersService } from "@/services/customers.service";
import { getApiErrorMessage } from "@/services/api";
import { useDebounce } from "@/hooks/useDebounce";
import { useCompany } from "@/hooks/useCompany";
import { formatPhone, getInitials } from "@/lib/utils";
import { maskPhone, maskState } from "@/lib/masks";
import {
  optionalEmailSchema,
  optionalPhoneSchema,
  optionalStateSchema,
} from "@/lib/form-schemas";
import { MaskedInput } from "@/components/ui/masked-input";
import type { Customer } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Informe o nome"),
  phone: optionalPhoneSchema,
  email: optionalEmailSchema,
  city: z.string().optional(),
  state: optionalStateSchema,
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
}) {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const isEditing = !!customer;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  React.useEffect(() => {
    if (open) {
      reset({
        name: customer?.name ?? "",
        phone: customer?.phone ? maskPhone(customer.phone) : "",
        email: customer?.email ?? "",
        city: customer?.city ?? "",
        state: customer?.state ?? "",
        notes: customer?.notes ?? "",
      });
    }
  }, [open, customer, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        ...values,
        email: values.email || undefined,
        phone: values.phone || undefined,
        state: values.state?.toUpperCase() || undefined,
      };
      return isEditing
        ? customersService.update(customer!.id, payload, companyId)
        : customersService.create(payload, companyId);
    },
    onSuccess: () => {
      toast.success(isEditing ? "Cliente atualizado com sucesso" : "Cliente cadastrado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      onOpenChange(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Atualize os dados do cliente." : "Preencha os dados para cadastrar um novo cliente."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" {...register("name")} placeholder="Nome completo" autoComplete="name" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefone</Label>
              <MaskedInput
                id="phone"
                type="tel"
                inputMode="tel"
                placeholder="(11) 99999-9999"
                value={watch("phone") ?? ""}
                mask={maskPhone}
                onValueChange={(v) => setValue("phone", v, { shouldValidate: true })}
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" inputMode="email" {...register("email")} placeholder="cliente@email.com" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="city">Cidade</Label>
              <Input id="city" {...register("city")} placeholder="São Paulo" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">UF</Label>
              <MaskedInput
                id="state"
                placeholder="SP"
                value={watch("state") ?? ""}
                mask={maskState}
                onValueChange={(v) => setValue("state", v, { shouldValidate: true })}
              />
              {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" {...register("notes")} placeholder="Preferências, histórico, etc." rows={3} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              {isEditing ? "Salvar alterações" : "Cadastrar cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CustomersPage() {
  const { companyId } = useCompany();
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const debouncedSearch = useDebounce(search);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Customer | null>(null);
  const [deleting, setDeleting] = React.useState<Customer | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["customers", { page, search: debouncedSearch, companyId }],
    queryFn: () => customersService.list({ page, limit: 10, search: debouncedSearch, companyId }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => customersService.remove(id, companyId),
    onSuccess: () => {
      toast.success("Cliente removido");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setDeleting(null);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const columns: DataTableColumn<Customer>[] = [
    {
      key: "name",
      header: "Cliente",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{getInitials(row.name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-foreground">{row.name}</p>
            <p className="text-xs text-muted-foreground">{row.email ?? "-"}</p>
          </div>
        </div>
      ),
    },
    { key: "phone", header: "Telefone", cell: (row) => <span>{formatPhone(row.phone)}</span> },
    {
      key: "location",
      header: "Localização",
      cell: (row) => <span className="text-muted-foreground">{[row.city, row.state].filter(Boolean).join(" - ") || "-"}</span>,
    },
    {
      key: "seller",
      header: "Vendedor",
      cell: (row) => <span className="text-muted-foreground">{row.seller?.name ?? "-"}</span>,
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
        description="Gerencie a base de compradores e interessados da sua loja"
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

      <div className="mb-4">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Buscar por nome, e-mail, telefone ou cidade..." />
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
        emptyTitle="Nenhum cliente encontrado"
        emptyDescription="Cadastre o primeiro cliente para começar."
      />

      {data && <Pagination meta={data.meta} onPageChange={setPage} />}

      <CustomerFormDialog open={formOpen} onOpenChange={setFormOpen} customer={editing} />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Remover ${deleting?.name}?`}
        description="Esta ação é irreversível."
        loading={removeMutation.isPending}
        onConfirm={() => deleting && removeMutation.mutate(deleting.id)}
      />
    </div>
  );
}
