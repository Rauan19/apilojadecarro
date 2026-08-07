import * as React from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { publicService } from "@/services/public.service";
import { StoreBannerCarousel } from "@/components/store/StoreBannerCarousel";
import { StoreCarIcon, StoreSearchIcon } from "@/components/store/StoreIcons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { EmptyState } from "@/components/shared/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { VehiclePrice } from "@/components/store/VehiclePrice";
import { cn, formatNumber } from "@/lib/utils";
import { fuelLabels, transmissionLabels, vehicleTypeLabels } from "@/utils/labels";
import { parseStoreBanners } from "@/utils/storeBanners";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import type { PublicStoreContext } from "@/layouts/PublicStoreLayout";
import type { Vehicle } from "@/types";

const COMMON_BRANDS = [
  "Chevrolet",
  "Volkswagen",
  "Fiat",
  "Ford",
  "Toyota",
  "Honda",
  "Hyundai",
  "Renault",
  "Nissan",
  "Jeep",
  "Peugeot",
  "Citroën",
  "Mitsubishi",
  "Kia",
  "BMW",
  "Mercedes-Benz",
  "Audi",
  "Volvo",
  "Caoa Chery",
];

const PRICE_PRESETS = [
  { label: "Até R$ 30 mil", min: undefined, max: 30000 },
  { label: "Até R$ 50 mil", min: undefined, max: 50000 },
  { label: "Até R$ 80 mil", min: undefined, max: 80000 },
  { label: "Acima de R$ 80 mil", min: 80000, max: undefined },
];

interface Filters {
  search: string;
  type: string;
  brand: string;
  fuel: string;
  transmission: string;
  minPrice: string;
  maxPrice: string;
}

const emptyFilters: Filters = {
  search: "",
  type: "all",
  brand: "all",
  fuel: "all",
  transmission: "all",
  minPrice: "",
  maxPrice: "",
};

function RadioRow({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 py-1.5 text-left text-sm text-[#3a3a3a] transition hover:text-[#2e2e2e]"
    >
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
          active ? "border-primary" : "border-[#c8c8c8]"
        )}
      >
        {active && <span className="h-2 w-2 rounded-full bg-primary" />}
      </span>
      <span className={active ? "font-semibold text-[#2e2e2e]" : ""}>{label}</span>
    </button>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-[#eee] py-4 first:pt-0 last:border-0">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#8a8a8a]">{title}</p>
      {children}
    </div>
  );
}

function FilterSidebarContent({
  filters,
  setFilters,
  onApply,
  onClear,
  hasActiveFilters,
}: {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  onApply: () => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between pb-3">
        <p className="font-display text-sm font-bold uppercase tracking-wide text-[#2e2e2e]">Filtrar</p>
        {hasActiveFilters && (
          <button type="button" onClick={onClear} className="text-xs font-bold text-primary hover:underline">
            Limpar tudo
          </button>
        )}
      </div>

      <FilterGroup title="Tipo de veículo">
        <RadioRow active={filters.type === "all"} label="Todos" onClick={() => setFilters((f) => ({ ...f, type: "all" }))} />
        {Object.entries(vehicleTypeLabels).map(([value, label]) => (
          <RadioRow
            key={value}
            active={filters.type === value}
            label={label}
            onClick={() => setFilters((f) => ({ ...f, type: value }))}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Marca">
        <select
          value={filters.brand}
          onChange={(e) => setFilters((f) => ({ ...f, brand: e.target.value }))}
          className="h-10 w-full rounded-md border border-[#d8d8d8] bg-white px-2.5 text-sm text-[#2e2e2e]"
        >
          <option value="all">Todas as marcas</option>
          {COMMON_BRANDS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </FilterGroup>

      <FilterGroup title="Preço">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="De"
            value={filters.minPrice}
            onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))}
            className="h-10 border-[#d8d8d8] text-sm"
          />
          <span className="text-[#c8c8c8]">–</span>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="Até"
            value={filters.maxPrice}
            onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))}
            className="h-10 border-[#d8d8d8] text-sm"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PRICE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() =>
                setFilters((f) => ({
                  ...f,
                  minPrice: preset.min ? String(preset.min) : "",
                  maxPrice: preset.max ? String(preset.max) : "",
                }))
              }
              className="rounded-full border border-[#d8d8d8] px-2.5 py-1 text-[11px] font-medium text-[#696969] transition hover:border-[#2e2e2e] hover:text-[#2e2e2e]"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Combustível">
        <RadioRow active={filters.fuel === "all"} label="Todos" onClick={() => setFilters((f) => ({ ...f, fuel: "all" }))} />
        {Object.entries(fuelLabels).map(([value, label]) => (
          <RadioRow
            key={value}
            active={filters.fuel === value}
            label={label}
            onClick={() => setFilters((f) => ({ ...f, fuel: value }))}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Câmbio">
        <RadioRow
          active={filters.transmission === "all"}
          label="Todos"
          onClick={() => setFilters((f) => ({ ...f, transmission: "all" }))}
        />
        {Object.entries(transmissionLabels).map(([value, label]) => (
          <RadioRow
            key={value}
            active={filters.transmission === value}
            label={label}
            onClick={() => setFilters((f) => ({ ...f, transmission: value }))}
          />
        ))}
      </FilterGroup>

      <Button type="button" onClick={onApply} className="mt-4 h-11 w-full font-bold lg:hidden">
        Ver resultados
      </Button>
    </div>
  );
}

function VehicleCard({ vehicle, basePath }: { vehicle: Vehicle; basePath: string }) {
  const cover = resolveMediaUrl(vehicle.images?.[0]?.url);

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
        <span className="absolute left-2 top-2 rounded bg-[#2e2e2e]/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
          {vehicle.year}
        </span>
      </div>
      <div className="space-y-1.5 p-3 sm:p-3.5">
        <div>
          <p className="font-display text-sm font-bold uppercase leading-snug tracking-tight text-[#2e2e2e] sm:text-[15px]">
            {vehicle.brand} {vehicle.model}
          </p>
          {vehicle.version && (
            <p className="mt-0.5 line-clamp-1 text-xs leading-snug text-[#696969] sm:text-[13px]">{vehicle.version}</p>
          )}
        </div>

        <p className="text-[11px] leading-relaxed text-[#696969] sm:text-xs">
          {vehicle.year}/{vehicle.yearModel}
          <span className="mx-1.5 text-[#d0d0d0]">·</span>
          {formatNumber(vehicle.mileage)} km
          <span className="mx-1.5 text-[#d0d0d0]">·</span>
          {fuelLabels[vehicle.fuel]}
          <span className="mx-1.5 hidden text-[#d0d0d0] sm:inline">·</span>
          <span className="hidden sm:inline">{transmissionLabels[vehicle.transmission]}</span>
        </p>

        <div className="border-t border-[#eee] pt-1.5">
          <VehiclePrice price={vehicle.price} originalPrice={vehicle.originalPrice} size="sm" />
        </div>
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

  const [filters, setFilters] = React.useState<Filters>(emptyFilters);
  const [page, setPage] = React.useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);
  const debouncedSearch = useDebounce(filters.search);
  const [searchParams, setSearchParams] = useSearchParams();

  // Termo enviado pela busca do header (?busca=). Aplica, limpa o parâmetro
  // — assim buscar o mesmo termo de novo volta a funcionar — e leva o
  // visitante direto para os resultados.
  React.useEffect(() => {
    const query = searchParams.get("busca");
    if (query === null) return;
    setFilters((f) => ({ ...f, search: query }));
    setPage(1);
    const next = new URLSearchParams(searchParams);
    next.delete("busca");
    setSearchParams(next, { replace: true });
    document.getElementById("estoque")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [searchParams, setSearchParams]);

  const { data, isLoading } = useQuery({
    queryKey: ["public-vehicles", slug, { ...filters, search: debouncedSearch, page }],
    queryFn: () =>
      publicService.getVehiclesBySlug(slug, {
        page,
        limit: 12,
        search: debouncedSearch || undefined,
        type: filters.type === "all" ? undefined : (filters.type as any),
        brand: filters.brand === "all" ? undefined : filters.brand,
        fuel: filters.fuel === "all" ? undefined : (filters.fuel as any),
        transmission: filters.transmission === "all" ? undefined : (filters.transmission as any),
        minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
      }),
    enabled: !!slug,
  });

  const settings = (company?.settings ?? {}) as Record<string, any>;
  const location = company?.city ?? "";
  const banners = parseStoreBanners(settings.banners);
  const hasActiveFilters =
    filters.type !== "all" ||
    filters.brand !== "all" ||
    filters.fuel !== "all" ||
    filters.transmission !== "all" ||
    !!filters.search ||
    !!filters.minPrice ||
    !!filters.maxPrice;

  const clearFilters = () => {
    setFilters(emptyFilters);
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

      <section
        id="estoque"
        className="scroll-mt-[4.5rem] border-b border-[#e6e6e6] bg-white sm:scroll-mt-24"
      >
        <div className="mx-auto max-w-7xl px-3 py-3 sm:px-6 sm:py-4">
          {/* Busca direta: filtra conforme digita (com debounce), sem botão. */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <div className="relative min-w-0 flex-1">
              <StoreSearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#696969]" />
              <Input
                id="busca-estoque"
                value={filters.search}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, search: e.target.value }));
                  setPage(1);
                }}
                placeholder="Digite marca ou modelo do carro"
                className="h-12 border-[#d8d8d8] bg-white pl-10 text-base text-[#2e2e2e] placeholder:text-[#999] focus-visible:ring-[#2e2e2e] sm:h-[3.25rem] sm:text-sm"
                enterKeyHint="search"
              />
            </div>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="btn-shape btn-3d btn-3d-soft flex h-12 shrink-0 items-center justify-center gap-2 border border-[#d8d8d8] bg-white px-4 text-sm font-bold text-[#2e2e2e] sm:h-[3.25rem] lg:hidden"
            >
              Filtros {hasActiveFilters && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[15.5rem_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-lg border border-[#e6e6e6] bg-white p-4">
              <FilterSidebarContent
                filters={filters}
                setFilters={setFilters}
                onApply={() => setPage(1)}
                onClear={clearFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </div>
          </aside>

          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetContent side="left" className="w-[min(20rem,88vw)] max-w-[20rem] overflow-y-auto bg-white p-5">
              <FilterSidebarContent
                filters={filters}
                setFilters={setFilters}
                onApply={() => {
                  setPage(1);
                  setMobileFiltersOpen(false);
                }}
                onClear={clearFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </SheetContent>
          </Sheet>

          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2 sm:mb-5">
              <div>
                <h2 className="font-display text-base font-bold text-[#2e2e2e] sm:text-xl">
                  {data
                    ? `${data.meta.total} carro${data.meta.total !== 1 ? "s" : ""} encontrado${data.meta.total !== 1 ? "s" : ""}`
                    : "Estoque"}
                </h2>
                <p className="text-xs text-[#696969] sm:text-sm">Anúncios da loja</p>
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="hidden text-xs font-bold text-[#2e2e2e] underline-offset-2 hover:underline lg:block"
                >
                  Limpar filtros
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <VehicleCardSkeleton key={i} />
                ))}
              </div>
            ) : !data || data.items.length === 0 ? (
              <EmptyState
                title="Nenhum veículo encontrado"
                description="Tente outro termo ou limpe os filtros."
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
                <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3">
                  {data.items.map((vehicle) => (
                    <VehicleCard key={vehicle.id} vehicle={vehicle} basePath={basePath} />
                  ))}
                </div>
                <div className="mt-6 sm:mt-8">
                  <Pagination meta={data.meta} onPageChange={setPage} />
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
