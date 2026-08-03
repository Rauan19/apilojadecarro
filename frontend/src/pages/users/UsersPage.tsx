import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Plus, Trash2, UserCheck, UserX } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
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
import { usersService } from "@/services/users.service";
import { companiesService } from "@/services/companies.service";
import { getApiErrorMessage } from "@/services/api";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/hooks/useAuth";
import { getInitials } from "@/lib/utils";
import { maskPhone } from "@/lib/masks";
import { optionalPhoneSchema, requiredEmailSchema } from "@/lib/form-schemas";
import { MaskedInput } from "@/components/ui/masked-input";
import { roleLabels } from "@/utils/labels";
import type { Role, User } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Informe o nome"),
  email: requiredEmailSchema,
  password: z.string().optional(),
  role: z.enum(["SUPER_ADMIN", "STORE_ADMIN", "SELLER"]),
  companyId: z.string().optional(),
  phone: optionalPhoneSchema,
  active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

function UserFormDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
}) {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const isEditing = !!user;
  const queryClient = useQueryClient();

  const { data: companiesData } = useQuery({
    queryKey: ["companies-picker"],
    queryFn: () => companiesService.list({ page: 1, limit: 100 }),
    enabled: isSuperAdmin && open,
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
    defaultValues: { role: "SELLER", active: true },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        name: user?.name ?? "",
        email: user?.email ?? "",
        password: "",
        role: user?.role ?? "SELLER",
        companyId: user?.companyId ?? currentUser?.companyId ?? undefined,
        phone: user?.phone ? maskPhone(user.phone) : "",
        active: user?.active ?? true,
      });
    }
  }, [open, user, reset, currentUser]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = { ...values, password: values.password || undefined };
      return isEditing
        ? usersService.update(user!.id, payload)
        : usersService.create({ ...payload, password: payload.password ?? "" });
    },
    onSuccess: () => {
      toast.success(isEditing ? "Usuário atualizado com sucesso" : "Usuário criado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onOpenChange(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const role = watch("role");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar usuário" : "Novo usuário"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Atualize os dados do usuário." : "Preencha os dados para criar um novo usuário."}
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
            <Input id="email" type="email" {...register("email")} placeholder="email@loja.com" />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">{isEditing ? "Nova senha (opcional)" : "Senha"}</Label>
            <Input id="password" type="password" {...register("password")} placeholder="••••••••" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <div className="space-y-1.5">
              <Label>Perfil</Label>
              <Select value={role} onValueChange={(value) => setValue("role", value as Role)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {isSuperAdmin && <SelectItem value="SUPER_ADMIN">{roleLabels.SUPER_ADMIN}</SelectItem>}
                  <SelectItem value="STORE_ADMIN">{roleLabels.STORE_ADMIN}</SelectItem>
                  <SelectItem value="SELLER">{roleLabels.SELLER}</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
          </div>

          {isSuperAdmin && role !== "SUPER_ADMIN" && (
            <div className="space-y-1.5">
              <Label>Loja / Cliente</Label>
              <Select value={watch("companyId")} onValueChange={(value) => setValue("companyId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a loja" />
                </SelectTrigger>
                <SelectContent>
                  {companiesData?.items.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Usuário ativo</p>
              <p className="text-xs text-muted-foreground">Usuários inativos não conseguem acessar o sistema</p>
            </div>
            <Switch checked={watch("active")} onCheckedChange={(checked) => setValue("active", checked)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              {isEditing ? "Salvar alterações" : "Criar usuário"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [companyId, setCompanyId] = React.useState<string>("all");
  const [role, setRole] = React.useState<string>("all");
  const [active, setActive] = React.useState<string>("all");
  const debouncedSearch = useDebounce(search);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<User | null>(null);
  const [deleting, setDeleting] = React.useState<User | null>(null);
  const queryClient = useQueryClient();

  const { data: companiesData } = useQuery({
    queryKey: ["companies-picker-users"],
    queryFn: () => companiesService.list({ page: 1, limit: 100 }),
    enabled: isSuperAdmin,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["users", { page, search: debouncedSearch, companyId, role, active }],
    queryFn: () =>
      usersService.list({
        page,
        limit: 10,
        search: debouncedSearch || undefined,
        companyId: companyId !== "all" ? companyId : undefined,
        role: role !== "all" ? (role as Role) : undefined,
        active: active === "all" ? undefined : active === "true",
      }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => usersService.remove(id),
    onSuccess: () => {
      toast.success("Usuário removido");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDeleting(null);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (row: User) => usersService.update(row.id, { active: !row.active }),
    onSuccess: () => {
      toast.success("Status atualizado");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const columns: DataTableColumn<User>[] = [
    {
      key: "user",
      header: "Usuário",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{getInitials(row.name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-foreground">{row.name}</p>
            <p className="text-xs text-muted-foreground">{row.email}</p>
          </div>
        </div>
      ),
    },
    ...(isSuperAdmin
      ? [
          {
            key: "company",
            header: "Loja",
            cell: (row: User) => (
              <span className="text-muted-foreground">{row.company?.name ?? "—"}</span>
            ),
          } satisfies DataTableColumn<User>,
        ]
      : []),
    { key: "role", header: "Perfil", cell: (row) => <Badge variant="outline">{roleLabels[row.role]}</Badge> },
    { key: "phone", header: "Telefone", cell: (row) => <span className="text-muted-foreground">{row.phone ?? "—"}</span> },
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
            <DropdownMenuItem onClick={() => toggleActiveMutation.mutate(row)}>
              {row.active ? <UserX /> : <UserCheck />} {row.active ? "Desativar" : "Ativar"}
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

  const clearFilters = () => {
    setCompanyId("all");
    setRole("all");
    setActive("all");
    setSearch("");
    setPage(1);
  };

  const hasFilters = companyId !== "all" || role !== "all" || active !== "all" || !!search;

  return (
    <div>
      <PageHeader
        title="Usuários"
        description="Gerencie os usuários com acesso ao sistema"
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus /> Novo usuário
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Buscar por nome, e-mail ou telefone..."
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_11rem_10rem_auto] lg:items-end">
          {isSuperAdmin && (
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Loja</Label>
              <Select
                value={companyId}
                onValueChange={(v) => {
                  setCompanyId(v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as lojas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as lojas</SelectItem>
                  {companiesData?.items.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Perfil</Label>
            <Select
              value={role}
              onValueChange={(v) => {
                setRole(v);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {isSuperAdmin && <SelectItem value="SUPER_ADMIN">{roleLabels.SUPER_ADMIN}</SelectItem>}
                <SelectItem value="STORE_ADMIN">{roleLabels.STORE_ADMIN}</SelectItem>
                <SelectItem value="SELLER">{roleLabels.SELLER}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Status</Label>
            <Select
              value={active}
              onValueChange={(v) => {
                setActive(v);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Ativos</SelectItem>
                <SelectItem value="false">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasFilters && (
            <Button type="button" variant="ghost" className="justify-self-start" onClick={clearFilters}>
              Limpar filtros
            </Button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        keyExtractor={(row) => row.id}
        emptyTitle="Nenhum usuário encontrado"
        emptyDescription="Ajuste os filtros ou cadastre um novo usuário."
      />

      {data && <Pagination meta={data.meta} onPageChange={setPage} />}

      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} user={editing} />

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
