import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Car, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  fuelLabels,
  transmissionLabels,
  vehicleStatusLabels,
  vehicleStatusVariant,
  vehicleTypeLabels,
} from "@/utils/labels";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { VehicleFormDialog } from "./VehicleFormDialog";
import type { Vehicle, VehicleType } from "@/types";

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

  const columns: DataTableColumn<Vehicle>[] = [
    {
      key: "vehicle",
      header: "Veículo",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
            {row.images[0] ? (
              <img src={resolveMediaUrl(row.images[0].url)} alt={row.model} className="h-full w-full object-cover" />
            ) : (
              <Car className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-medium text-foreground">
                {row.brand} {row.model}
              </p>
              <Badge variant="outline" className="shrink-0 text-[10px]">
                {vehicleTypeLabels[row.type]}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{row.version || `${row.year}/${row.yearModel}`}</p>
          </div>
        </div>
      ),
    },
    {
      key: "specs",
      header: "Especificações",
      cell: (row) => (
        <div className="text-xs text-muted-foreground">
          <p>
            {fuelLabels[row.fuel]} · {transmissionLabels[row.transmission]}
          </p>
          <p>{formatNumber(row.mileage)} km</p>
        </div>
      ),
    },
    {
      key: "price",
      header: "Preço",
      cell: (row) => {
        const profit =
          row.status === "SOLD" &&
          row.soldPrice != null &&
          row.purchasePrice != null
            ? row.soldPrice - row.purchasePrice
            : null;
        return (
          <div>
            {row.originalPrice != null && row.originalPrice > row.price ? (
              <p className="text-xs text-muted-foreground line-through">{formatCurrency(row.originalPrice)}</p>
            ) : null}
            <span className="font-medium">{formatCurrency(row.price)}</span>
            {row.originalPrice != null && row.originalPrice > row.price ? (
              <span className="ml-1.5 text-xs font-bold text-[#e81123]">
                -{Math.round(((row.originalPrice - row.price) / row.originalPrice) * 100)}%
              </span>
            ) : null}
            {row.status === "SOLD" && row.soldPrice != null && row.soldPrice > 0 ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Vendido por {formatCurrency(row.soldPrice)}
              </p>
            ) : null}
            {profit != null ? (
              <p className={`text-xs font-semibold ${profit >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                Lucro {formatCurrency(profit)}
              </p>
            ) : null}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <Badge variant={vehicleStatusVariant[row.status]}>{vehicleStatusLabels[row.status]}</Badge>,
    },
    ...(canManage
      ? [
          {
            key: "actions",
            header: "",
            headerClassName: "w-12",
            cell: (row: Vehicle) => (
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
        title="Veículos"
        description={canManage ? "Gerencie o estoque de veículos da sua loja" : "Consulte o estoque de veículos"}
        actions={
          canManage && (
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus /> Novo veículo
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Buscar por marca, modelo, placa ou cor..."
        />
        <Select
          value={type}
          onValueChange={(v) => {
            setType(v as VehicleType | "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {Object.entries(vehicleTypeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        keyExtractor={(row) => row.id}
        onRowClick={
          canManage
            ? (row) => {
                setEditing(row);
                setFormOpen(true);
              }
            : undefined
        }
        emptyTitle="Nenhum veículo encontrado"
        emptyDescription="Cadastre o primeiro veículo do estoque."
      />

      {data && <Pagination meta={data.meta} onPageChange={setPage} />}

      {canManage && <VehicleFormDialog open={formOpen} onOpenChange={setFormOpen} vehicle={editing} />}

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
