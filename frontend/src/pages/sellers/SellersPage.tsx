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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { sellersService } from "@/services/sellers.service";
import { getApiErrorMessage } from "@/services/api";
import { useDebounce } from "@/hooks/useDebounce";
import { useCompany } from "@/hooks/useCompany";
import { getInitials } from "@/lib/utils";
import type { Seller } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Informe o nome"),
  email: z.string().email("E-mail inválido"),
  password: z.string().optional(),
  phone: z.string().optional(),
  commission: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
  active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

function SellerFormDialog({
  open,
  onOpenChange,
  seller,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seller?: Seller | null;
}) {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const isEditing = !!seller;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { active: true, commission: 0 } });

  React.useEffect(() => {
    if (open) {
      reset({
        name: seller?.user.name ?? "",
        email: seller?.user.email ?? "",
        password: "",
        phone: seller?.user.phone ?? "",
        commission: seller?.commission ?? 0,
        notes: seller?.notes ?? "",
        active: seller?.active ?? true,
      });
    }
  }, [open, seller, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = { ...values, password: values.password || undefined };
      return isEditing
        ? sellersService.update(seller!.id, payload, companyId)
        : sellersService.create({ ...payload, password: payload.password ?? "" }, companyId);
    },
    onSuccess: () => {
      toast.success(isEditing ? "Vendedor atualizado com sucesso" : "Vendedor cadastrado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["sellers"] });
      onOpenChange(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar vendedor" : "Novo vendedor"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Atualize os dados do vendedor." : "Cadastre um novo vendedor para sua equipe."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((values) => {
            if (!isEditing && (!values.password || values.password.length < 6)) {
              toast.error("A senha deve ter no mínimo 6 caracteres");
              return;
            }
            mutation.mutate(values);
          })}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" {...register("name")} placeholder="Nome completo" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" {...register("email")} placeholder="vendedor@empresa.com" />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">{isEditing ? "Nova senha (opcional)" : "Senha"}</Label>
            <Input id="password" type="password" {...register("password")} placeholder="••••••••" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" {...register("phone")} placeholder="(11) 99999-9999" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="commission">Comissão (%)</Label>
              <Input id="commission" type="number" step="0.1" {...register("commission")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" {...register("notes")} placeholder="Especialidade, metas, etc." rows={2} />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Vendedor ativo</p>
              <p className="text-xs text-muted-foreground">Vendedores inativos não conseguem acessar o sistema</p>
            </div>
            <Switch checked={watch("active")} onCheckedChange={(checked) => setValue("active", checked)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              {isEditing ? "Salvar alterações" : "Cadastrar vendedor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SellersPage() {
  const { companyId } = useCompany();
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const debouncedSearch = useDebounce(search);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Seller | null>(null);
  const [deleting, setDeleting] = React.useState<Seller | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["sellers", { page, search: debouncedSearch, companyId }],
    queryFn: () => sellersService.list({ page, limit: 10, search: debouncedSearch, companyId }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => sellersService.remove(id, companyId),
    onSuccess: () => {
      toast.success("Vendedor removido");
      queryClient.invalidateQueries({ queryKey: ["sellers"] });
      setDeleting(null);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const columns: DataTableColumn<Seller>[] = [
    {
      key: "name",
      header: "Vendedor",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{getInitials(row.user.name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-foreground">{row.user.name}</p>
            <p className="text-xs text-muted-foreground">{row.user.email}</p>
          </div>
        </div>
      ),
    },
    { key: "phone", header: "Telefone", cell: (row) => <span className="text-muted-foreground">{row.user.phone ?? "-"}</span> },
    {
      key: "commission",
      header: "Comissão",
      cell: (row) => <span>{row.commission ?? 0}%</span>,
    },
    {
      key: "active",
      header: "Status",
      cell: (row) => <Badge variant={row.active ? "success" : "secondary"}>{row.active ? "Ativo" : "Inativo"}</Badge>,
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
        title="Vendedores"
        description="Gerencie a equipe de vendas da sua loja"
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus /> Novo vendedor
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
        onRowClick={(row) => {
          setEditing(row);
          setFormOpen(true);
        }}
        emptyTitle="Nenhum vendedor encontrado"
        emptyDescription="Cadastre o primeiro vendedor da sua equipe."
      />

      {data && <Pagination meta={data.meta} onPageChange={setPage} />}

      <SellerFormDialog open={formOpen} onOpenChange={setFormOpen} seller={editing} />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Remover ${deleting?.user.name}?`}
        description="Esta ação é irreversível."
        loading={removeMutation.isPending}
        onConfirm={() => deleting && removeMutation.mutate(deleting.id)}
      />
    </div>
  );
}
