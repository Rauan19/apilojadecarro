import * as React from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { publicService } from "@/services/public.service";
import { StoreBannerCarousel } from "@/components/store/StoreBannerCarousel";
import { StoreCarIcon, StoreSearchIcon } from "@/components/store/StoreIcons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { VehiclePrice } from "@/components/store/VehiclePrice";
import { cn, formatNumber } from "@/lib/utils";
import { fuelLabels, transmissionLabels } from "@/utils/labels";
import { parseStoreBanners } from "@/utils/storeBanners";
import type { PublicStoreContext } from "@/layouts/PublicStoreLayout";
import type { Vehicle } from "@/types";

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 shrink-0 items-center rounded-full border px-3.5 text-xs font-semibold transition sm:h-10 sm:text-sm",
        active
          ? "border-[#2e2e2e] bg-[#2e2e2e] text-white"
          : "border-[#d8d8d8] bg-white text-[#2e2e2e] hover:border-[#2e2e2e]"
      )}
    >
      {children}
    </button>
  );
}

function VehicleCard({ vehicle, basePath }: { vehicle: Vehicle; basePath: string }) {
  const cover = vehicle.images?.[0]?.url;

  return (
    <Link to={`${basePath}/veiculo/${vehicle.id}`} className="store-card group block">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#f5f5f5]">
        {cover ? (
          <img
            src={cover}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#b0b0b0]">
            <StoreCarIcon className="h-10 w-10 sm:h-12 sm:w-12" />
          </div>
        )}
      </div>
      <div className="space-y-2 p-3 sm:p-3.5">
        <div>
          <p className="font-display text-sm font-bold uppercase leading-snug tracking-tight text-[#2e2e2e] sm:text-[15px]">
            {vehicle.brand} {vehicle.model}
          </p>
          {vehicle.version && (
            <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-[#696969] sm:text-[13px]">{vehicle.version}</p>
          )}
        </div>

        <VehiclePrice price={vehicle.price} originalPrice={vehicle.originalPrice} size="sm" />

        <p className="text-[11px] leading-relaxed text-[#696969] sm:text-xs">
          {vehicle.year}/{vehicle.yearModel}
          <span className="mx-1.5 text-[#d0d0d0]">·</span>
          {formatNumber(vehicle.mileage)} km
          <span className="mx-1.5 text-[#d0d0d0]">·</span>
          {fuelLabels[vehicle.fuel]}
          <span className="mx-1.5 hidden text-[#d0d0d0] sm:inline">·</span>
          <span className="hidden sm:inline">{transmissionLabels[vehicle.transmission]}</span>
        </p>
      </div>
    </Link>
  );
}

function VehicleCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-md border border-[#e6e6e6] bg-white">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

export function StoreHomePage() {
  const { company, slug } = useOutletContext<PublicStoreContext>();
  const basePath = `/loja/${slug}`;

  const [search, setSearch] = React.useState("");
  const [fuel, setFuel] = React.useState<string>("all");
  const [transmission, setTransmission] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);
  const [draftSearch, setDraftSearch] = React.useState("");
  const debouncedSearch = useDebounce(search);

  const { data, isLoading } = useQuery({
    queryKey: ["public-vehicles", slug, { debouncedSearch, fuel, transmission, page }],
    queryFn: () =>
      publicService.getVehiclesBySlug(slug, {
        page,
        limit: 12,
        search: debouncedSearch || undefined,
        fuel: fuel === "all" ? undefined : (fuel as any),
        transmission: transmission === "all" ? undefined : (transmission as any),
      }),
    enabled: !!slug,
  });

  const settings = (company?.settings ?? {}) as Record<string, any>;
  const location = company?.city ?? "";
  const banners = parseStoreBanners(settings.banners);
  const hasActiveFilters = fuel !== "all" || transmission !== "all" || !!search;

  const applySearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setSearch(draftSearch);
    setPage(1);
  };

  const clearFilters = () => {
    setDraftSearch("");
    setSearch("");
    setFuel("all");
    setTransmission("all");
    setPage(1);
  };

  const fallbackTitle = `Carros novos e usados${location ? ` em ${location}` : " no nosso estoque"}`;
  const fallbackSubtitle = settings.about
    ? String(settings.about).slice(0, 120) + (String(settings.about).length > 120 ? "…" : "")
    : "Compare preços, quilometragem e fale direto com a loja.";

  return (
    <div>
      <StoreBannerCarousel
        banners={banners}
        fallbackTitle={fallbackTitle}
        fallbackSubtitle={fallbackSubtitle}
      />

      <section className="border-b border-[#e6e6e6] bg-white">
        <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-5">
          <form onSubmit={applySearch} className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <div className="relative min-w-0 flex-1">
                <StoreSearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#696969]" />
                <Input
                  value={draftSearch}
                  onChange={(e) => setDraftSearch(e.target.value)}
                  placeholder="Digite marca ou modelo do carro"
                  className="h-12 rounded-md border-[#d8d8d8] bg-white pl-10 text-base text-[#2e2e2e] placeholder:text-[#999] focus-visible:ring-[#2e2e2e] sm:h-[3.25rem] sm:text-sm"
                  enterKeyHint="search"
                />
              </div>
              <Button
                type="submit"
                className="h-12 shrink-0 rounded-md px-8 text-sm font-bold sm:h-[3.25rem] sm:min-w-[9rem]"
              >
                Buscar
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="mb-2 text-xs font-semibold text-[#696969]">Combustível</p>
                <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
                  <FilterChip
                    active={fuel === "all"}
                    onClick={() => {
                      setFuel("all");
                      setPage(1);
                    }}
                  >
                    Todos
                  </FilterChip>
                  {Object.entries(fuelLabels).map(([value, label]) => (
                    <FilterChip
                      key={value}
                      active={fuel === value}
                      onClick={() => {
                        setFuel(value);
                        setPage(1);
                      }}
                    >
                      {label}
                    </FilterChip>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-[#696969]">Câmbio</p>
                <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
                  <FilterChip
                    active={transmission === "all"}
                    onClick={() => {
                      setTransmission("all");
                      setPage(1);
                    }}
                  >
                    Todos
                  </FilterChip>
                  {Object.entries(transmissionLabels).map(([value, label]) => (
                    <FilterChip
                      key={value}
                      active={transmission === value}
                      onClick={() => {
                        setTransmission(value);
                        setPage(1);
                      }}
                    >
                      {label}
                    </FilterChip>
                  ))}
                </div>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex items-center justify-between gap-2 border-t border-[#eee] pt-3">
                <p className="text-xs text-[#696969]">Filtros ativos</p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-bold text-[#2e2e2e] underline-offset-2 hover:underline"
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2 sm:mb-5">
          <div>
            <h2 className="font-display text-base font-bold text-[#2e2e2e] sm:text-xl">
              {data
                ? `${data.meta.total} carro${data.meta.total !== 1 ? "s" : ""} encontrado${data.meta.total !== 1 ? "s" : ""}`
                : "Estoque"}
            </h2>
            <p className="text-xs text-[#696969] sm:text-sm">Anúncios da loja</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <VehicleCardSkeleton key={i} />
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            title="Nenhum veículo encontrado"
            description="Tente outro termo ou limpe os filtros de combustível e câmbio."
            action={
              hasActiveFilters ? (
                <Button type="button" variant="outline" onClick={clearFilters} className="mt-2 border-[#2e2e2e] text-[#2e2e2e]">
                  Limpar filtros
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {data.items.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} basePath={basePath} />
              ))}
            </div>
            <div className="mt-6 sm:mt-8">
              <Pagination meta={data.meta} onPageChange={setPage} />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
