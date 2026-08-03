import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { plansService } from "@/services/plans.service";
import { getApiErrorMessage } from "@/services/api";
import { formatCurrency } from "@/lib/utils";
import type { SubscriptionPlan } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Informe o nome do plano"),
  slug: z.string().optional(),
  description: z.string().optional(),
  priceMonthly: z.coerce.number().min(0, "Preço inválido"),
  featuresText: z.string().min(1, "Informe o que o plano inclui"),
  maxVehicles: z.string().optional(),
  maxUsers: z.string().optional(),
  active: z.boolean(),
  sortOrder: z.coerce.number().int().optional(),
});

type FormValues = z.infer<typeof schema>;

function PlanFormDialog({
  open,
  onOpenChange,
  plan,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: SubscriptionPlan | null;
}) {
  const queryClient = useQueryClient();
  const isEditing = !!plan;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { active: true, priceMonthly: 97, sortOrder: 0 },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        name: plan?.name ?? "",
        slug: plan?.slug ?? "",
        description: plan?.description ?? "",
        priceMonthly: plan?.priceMonthly ?? 97,
        featuresText: plan?.features?.join("\n") ?? "",
        maxVehicles: plan?.maxVehicles != null ? String(plan.maxVehicles) : "",
        maxUsers: plan?.maxUsers != null ? String(plan.maxUsers) : "",
        active: plan?.active ?? true,
        sortOrder: plan?.sortOrder ?? 0,
      });
    }
  }, [open, plan, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const features = values.featuresText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      const payload = {
        name: values.name,
        slug: values.slug || undefined,
        description: values.description || undefined,
        priceMonthly: values.priceMonthly,
        features,
        maxVehicles: values.maxVehicles ? Number(values.maxVehicles) : null,
        maxUsers: values.maxUsers ? Number(values.maxUsers) : null,
        active: values.active,
        sortOrder: values.sortOrder ?? 0,
      };

      return isEditing ? plansService.update(plan!.id, payload) : plansService.create(payload);
    },
    onSuccess: () => {
      toast.success(isEditing ? "Plano atualizado" : "Plano criado");
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      onOpenChange(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar plano" : "Novo plano"}</DialogTitle>
          <DialogDescription>
            Defina o preço e o que cada loja recebe neste plano.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" {...register("name")} placeholder="Profissional" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="priceMonthly">Preço mensal (R$)</Label>
              <Input id="priceMonthly" type="number" step="0.01" inputMode="decimal" {...register("priceMonthly")} />
              {errors.priceMonthly && <p className="text-xs text-destructive">{errors.priceMonthly.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug (opcional)</Label>
              <Input id="slug" {...register("slug")} placeholder="profissional" />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Input id="description" {...register("description")} placeholder="Para lojas em crescimento" />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="featuresText">O que inclui (uma linha por item)</Label>
              <Textarea
                id="featuresText"
                rows={5}
                {...register("featuresText")}
                placeholder={"Veículos ilimitados\nAté 15 usuários\nAPI pública"}
              />
              {errors.featuresText && <p className="text-xs text-destructive">{errors.featuresText.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="maxVehicles">Limite de veículos (vazio = ilimitado)</Label>
              <Input id="maxVehicles" inputMode="numeric" {...register("maxVehicles")} placeholder="80" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="maxUsers">Limite de usuários (vazio = ilimitado)</Label>
              <Input id="maxUsers" inputMode="numeric" {...register("maxUsers")} placeholder="10" />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3 sm:col-span-2">
              <div>
                <p className="text-sm font-medium">Plano ativo</p>
                <p className="text-xs text-muted-foreground">Planos inativos não aparecem na atribuição</p>
              </div>
              <Switch checked={watch("active")} onCheckedChange={(v) => setValue("active", v)} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              {isEditing ? "Salvar" : "Criar plano"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PlansPage() {
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<SubscriptionPlan | null>(null);
  const [deleting, setDeleting] = React.useState<SubscriptionPlan | null>(null);
  const queryClient = useQueryClient();

  const { data: plans, isLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: () => plansService.list(false),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => plansService.remove(id),
    onSuccess: () => {
      toast.success("Plano removido");
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      setDeleting(null);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const columns: DataTableColumn<SubscriptionPlan>[] = [
    {
      key: "name",
      header: "Plano",
      cell: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.description || `/${row.slug}`}</p>
        </div>
      ),
    },
    {
      key: "price",
      header: "Mensalidade",
      cell: (row) => <span className="font-medium">{formatCurrency(row.priceMonthly)}</span>,
    },
    {
      key: "features",
      header: "Inclui",
      cell: (row) => (
        <ul className="max-w-xs space-y-0.5 text-xs text-muted-foreground">
          {row.features.slice(0, 3).map((f) => (
            <li key={f}>• {f}</li>
          ))}
          {row.features.length > 3 && <li>+{row.features.length - 3} itens</li>}
        </ul>
      ),
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
        title="Planos"
        description="Crie e configure os planos que você vende para cada loja"
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus /> Novo plano
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={plans ?? []}
        isLoading={isLoading}
        keyExtractor={(row) => row.id}
        emptyTitle="Nenhum plano cadastrado"
        emptyDescription="Crie o primeiro plano e depois atribua às lojas em Clientes."
      />

      <PlanFormDialog open={formOpen} onOpenChange={setFormOpen} plan={editing} />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Remover plano "${deleting?.name}"?`}
        description="Só é possível remover se nenhuma loja estiver usando este plano."
        loading={removeMutation.isPending}
        onConfirm={() => deleting && removeMutation.mutate(deleting.id)}
      />
    </div>
  );
}
