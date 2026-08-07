import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Car, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { SearchInput } from "@/components/shared/SearchInput";
import { Pagination } from "@/components/shared/Pagination";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { vehiclesService } from "@/services/vehicles.service";
import { getApiErrorMessage } from "@/services/api";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import {
  fuelLabels,
  transmissionLabels,
  vehicleStatusLabels,
  vehicleTypeLabels,
} from "@/utils/labels";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { VehicleFormDialog } from "./VehicleFormDialog";
import type { Vehicle, VehicleStatus, VehicleType } from "@/types";

const statusTone: Record<VehicleStatus, string> = {
  AVAILABLE: "text-primary",
  RESERVED: "text-[hsl(var(--warning))]",
  SOLD: "text-success",
  MAINTENANCE: "text-destructive",
};

const typeFilters: { value: VehicleType | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  ...Object.entries(vehicleTypeLabels).map(([value, label]) => ({
    value: value as VehicleType,
    label,
  })),
];

function VehicleRow({
  vehicle,
  canManage,
  onEdit,
  onDelete,
}: {
  vehicle: Vehicle;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const profit =
    vehicle.status === "SOLD" &&
    vehicle.soldPrice != null &&
    vehicle.purchasePrice != null
      ? vehicle.soldPrice - vehicle.purchasePrice
      : null;

  const discount =
    vehicle.originalPrice != null && vehicle.originalPrice > vehicle.price
      ? Math.round(((vehicle.originalPrice - vehicle.price) / vehicle.originalPrice) * 100)
      : null;

  return (
    <article
      className={cn(
        "group grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-3 border-b border-border/70 py-4 sm:grid-cols-[7.5rem_minmax(0,1fr)_auto] sm:gap-x-5 sm:py-5",
        canManage && "cursor-pointer",
      )}
      onClick={canManage ? onEdit : undefined}
      onKeyDown={
        canManage
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onEdit();
              }
            }
          : undefined
      }
      role={canManage ? "button" : undefined}
      tabIndex={canManage ? 0 : undefined}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-[#12141A]/[0.06] sm:row-span-2 sm:aspect-[5/4] sm:self-center">
        {vehicle.images[0] ? (
          <img
            src={resolveMediaUrl(vehicle.images[0].url)}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Car className="h-7 w-7 text-muted-foreground/50" />
          </div>
        )}
      </div>

      <div className="min-w-0 self-center">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className={cn("text-xs font-semibold", statusTone[vehicle.status])}>
            {vehicleStatusLabels[vehicle.status]}
          </p>
          <span className="text-xs text-muted-foreground/50">·</span>
          <p className="text-xs text-muted-foreground">{vehicleTypeLabels[vehicle.type]}</p>
        </div>

        <h2 className="mt-1 font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
          {vehicle.brand} {vehicle.model}
        </h2>

        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {vehicle.version || `${vehicle.year}/${vehicle.yearModel}`}
        </p>

        <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
          {vehicle.year}/{vehicle.yearModel}
          <span className="mx-1.5 text-muted-foreground/40">·</span>
          {fuelLabels[vehicle.fuel]}
          <span className="mx-1.5 text-muted-foreground/40">·</span>
          {transmissionLabels[vehicle.transmission]}
          <span className="mx-1.5 text-muted-foreground/40">·</span>
          {formatNumber(vehicle.mileage)} km
        </p>
      </div>

      <div className="col-start-2 flex items-end justify-between gap-3 sm:col-start-3 sm:row-span-2 sm:flex-col sm:items-end sm:justify-center sm:self-center">
        <PriceBlock vehicle={vehicle} discount={discount} profit={profit} />

        {canManage ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Ações</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={onEdit}>
                <Pencil /> Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onClick={onDelete}>
                <Trash2 /> Remover
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </article>
  );
}

function PriceBlock({
  vehicle,
  discount,
  profit,
}: {
  vehicle: Vehicle;
  discount: number | null;
  profit: number | null;
}) {
  return (
    <div>
      {vehicle.originalPrice != null && vehicle.originalPrice > vehicle.price ? (
        <p className="text-xs text-muted-foreground line-through sm:text-right">
          {formatCurrency(vehicle.originalPrice)}
        </p>
      ) : null}
      <p className="font-display text-xl font-bold tracking-tight tabular-nums text-foreground sm:text-right sm:text-2xl">
        {formatCurrency(vehicle.price)}
      </p>
      {discount != null ? (
        <p className="mt-0.5 text-xs font-semibold text-primary sm:text-right">-{discount}%</p>
      ) : null}
      {vehicle.status === "SOLD" && vehicle.soldPrice != null && vehicle.soldPrice > 0 ? (
        <p className="mt-1 text-xs text-muted-foreground sm:text-right">
          Vendido por {formatCurrency(vehicle.soldPrice)}
        </p>
      ) : null}
      {profit != null ? (
        <p
          className={cn(
            "mt-0.5 text-xs font-semibold sm:text-right",
            profit >= 0 ? "text-success" : "text-destructive",
          )}
        >
          Lucro {formatCurrency(profit)}
        </p>
      ) : null}
    </div>
  );
}

export function VehiclesPage() {
  const { user } = useAuth();
  const { companyId } = useCompany();
  const canManage = user?.role === "SUPER_ADMIN" || user?.role === "STORE_ADMIN";

  const [search, setSearch] = React.useState("");
  const [type, setType] = React.useState<VehicleType | "all">("all");
  const [page, setPage] = React.useState(1);
  const debouncedSearch = useDebounce(search);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Vehicle | null>(null);
  const [deleting, setDeleting] = React.useState<Vehicle | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["vehicles", { page, search: debouncedSearch, type, companyId }],
    queryFn: () =>
      vehiclesService.list({
        page,
        limit: 10,
        search: debouncedSearch,
        type: type === "all" ? undefined : type,
        companyId,
      }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => vehiclesService.remove(id, companyId),
    onSuccess: () => {
      toast.success("Veículo removido");
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setDeleting(null);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const total = data?.meta.total ?? 0;
  const items = data?.items ?? [];

  return (
    <div className="vehicles-board space-y-6 sm:space-y-8">
      <header className="relative overflow-hidden rounded-2xl bg-[#12141A] text-white">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-primary" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0 opacity-55"
          style={{
            background:
              "radial-gradient(ellipse 65% 80% at 100% 0%, rgba(227,28,35,0.34), transparent 55%)",
          }}
        />
        <div className="relative flex flex-col gap-6 px-5 py-7 pl-6 sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:py-8 sm:pl-9">
          <div>
            <p className="text-sm text-white/50">Pátio da loja</p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Estoque
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/60">
              {canManage
                ? "Cadastre, ajuste preço e acompanhe cada unidade no pátio."
                : "Consulte o estoque disponível na loja."}
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-5 sm:gap-8">
            <div>
              <p className="text-sm text-white/45">No estoque</p>
              <p className="font-display text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">
                {isLoading ? "—" : formatNumber(total)}
              </p>
            </div>
            {canManage && (
              <Button
                className="rounded-md"
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <Plus /> Novo veículo
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Buscar marca, modelo, placa ou cor..."
          containerClassName="w-full sm:max-w-md"
        />

        <div className="flex flex-wrap gap-1.5">
          {typeFilters.map((item) => {
            const active = type === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  setType(item.value);
                  setPage(1);
                }}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition",
                  active
                    ? "bg-[#12141A] text-white"
                    : "bg-secondary text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-border/70">
        {isLoading && (
          <div className="divide-y divide-border/70">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4 py-5">
                <div className="h-20 w-28 animate-pulse rounded-md bg-muted/70 sm:h-24 sm:w-36" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 w-24 animate-pulse rounded bg-muted/70" />
                  <div className="h-5 w-48 animate-pulse rounded bg-muted/70" />
                  <div className="h-3 w-64 max-w-full animate-pulse rounded bg-muted/60" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="flex flex-col items-start gap-3 py-14">
            <p className="font-display text-xl font-bold tracking-tight text-foreground">
              Nenhum veículo encontrado
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {search || type !== "all"
                ? "Ajuste a busca ou o filtro de tipo e tente de novo."
                : "Cadastre o primeiro veículo do estoque para montar o pátio."}
            </p>
            {canManage && !search && type === "all" && (
              <Button
                className="mt-1"
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <Plus /> Novo veículo
              </Button>
            )}
          </div>
        )}

        {!isLoading &&
          items.map((vehicle) => (
            <VehicleRow
              key={vehicle.id}
              vehicle={vehicle}
              canManage={canManage}
              onEdit={() => {
                setEditing(vehicle);
                setFormOpen(true);
              }}
              onDelete={() => setDeleting(vehicle)}
            />
          ))}
      </div>

      {data && <Pagination meta={data.meta} onPageChange={setPage} />}

      {canManage && (
        <VehicleFormDialog open={formOpen} onOpenChange={setFormOpen} vehicle={editing} />
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Remover ${deleting?.brand} ${deleting?.model}?`}
        description="Esta ação é irreversível."
        loading={removeMutation.isPending}
        onConfirm={() => deleting && removeMutation.mutate(deleting.id)}
      />
    </div>
  );
}
