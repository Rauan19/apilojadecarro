import * as React from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Car, Fuel, Gauge, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { publicService } from "@/services/public.service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { fuelLabels, transmissionLabels } from "@/utils/labels";
import type { PublicStoreContext } from "@/layouts/PublicStoreLayout";
import type { Vehicle } from "@/types";

function VehicleCard({ vehicle, basePath }: { vehicle: Vehicle; basePath: string }) {
  const cover = vehicle.images?.[0]?.url;

  return (
    <Link to={`${basePath}/veiculo/${vehicle.id}`} className="group block">
      <Card className="h-full overflow-hidden py-0 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary">
          {cover ? (
            <img
              src={cover}
              alt={`${vehicle.brand} ${vehicle.model}`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Car className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
          <Badge className="absolute left-3 top-3 bg-background/90 text-foreground shadow-sm" variant="outline">
            {vehicle.year}/{vehicle.yearModel}
          </Badge>
        </div>
        <CardContent className="space-y-2 p-4">
          <div>
            <p className="font-display text-base font-semibold leading-tight">
              {vehicle.brand} {vehicle.model}
            </p>
            {vehicle.version && <p className="text-sm text-muted-foreground">{vehicle.version}</p>}
          </div>
          <p className="font-display text-xl font-bold text-primary">{formatCurrency(vehicle.price)}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Gauge className="h-3.5 w-3.5" /> {formatNumber(vehicle.mileage)} km
            </span>
            <span className="flex items-center gap-1">
              <Fuel className="h-3.5 w-3.5" /> {fuelLabels[vehicle.fuel]}
            </span>
            <span>{transmissionLabels[vehicle.transmission]}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function VehicleCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-[4/3] w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-5 w-1/2" />
    </div>
  );
}

export function StoreHomePage() {
  const { company, token, slug } = useOutletContext<PublicStoreContext>();
  const basePath = slug ? `/loja/${slug}` : "/loja";

  const [search, setSearch] = React.useState("");
  const [fuel, setFuel] = React.useState<string>("all");
  const [transmission, setTransmission] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);
  const debouncedSearch = useDebounce(search);

  const { data, isLoading } = useQuery({
    queryKey: ["public-vehicles", { debouncedSearch, fuel, transmission, page }],
    queryFn: () =>
      publicService.getVehicles(
        {
          page,
          limit: 9,
          search: debouncedSearch || undefined,
          fuel: fuel === "all" ? undefined : (fuel as any),
          transmission: transmission === "all" ? undefined : (transmission as any),
        },
        token
      ),
    enabled: !!token,
  });

  const settings = (company?.settings ?? {}) as Record<string, any>;

  return (
    <div>
      <section className="relative overflow-hidden bg-sidebar text-sidebar-foreground">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_hsl(174_60%_35%/0.35),_transparent_55%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <Badge className="mb-4 gap-1.5 border-white/10 bg-white/10 text-white" variant="outline">
            <Sparkles className="h-3.5 w-3.5" /> Estoque atualizado
          </Badge>
          <h1 className="font-display max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">
            {company?.name ?? "Encontre seu próximo carro"}
          </h1>
          <p className="mt-4 max-w-xl text-sidebar-foreground/70 sm:text-lg">
            {settings.about ?? "Confira nosso estoque completo de veículos revisados e prontos para você."}
          </p>

          <div className="mt-8 flex flex-col gap-3 rounded-xl bg-white/5 p-3 backdrop-blur-sm sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sidebar-foreground/50" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Busque por marca ou modelo..."
                className="border-white/10 bg-white/10 pl-9 text-white placeholder:text-sidebar-foreground/50 focus-visible:ring-white/30"
              />
            </div>
            <Select
              value={fuel}
              onValueChange={(v) => {
                setFuel(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="border-white/10 bg-white/10 text-white sm:w-44">
                <SelectValue placeholder="Combustível" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos combustíveis</SelectItem>
                {Object.entries(fuelLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={transmission}
              onValueChange={(v) => {
                setTransmission(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="border-white/10 bg-white/10 text-white sm:w-44">
                <SelectValue placeholder="Câmbio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos câmbios</SelectItem>
                {Object.entries(transmissionLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">
            {data ? `${data.meta.total} veículo${data.meta.total !== 1 ? "s" : ""} disponíve${data.meta.total !== 1 ? "is" : "l"}` : "Estoque"}
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <VehicleCardSkeleton key={i} />
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            icon={SlidersHorizontal}
            title="Nenhum veículo encontrado"
            description="Tente ajustar os filtros de busca ou volte novamente em breve."
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} basePath={basePath} />
              ))}
            </div>
            <div className="mt-8">
              <Pagination meta={data.meta} onPageChange={setPage} />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
