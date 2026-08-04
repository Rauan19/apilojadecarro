import * as React from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ShareVehicleButton } from "@/components/store/ShareVehicleButton";
import { ImageLightbox } from "@/components/store/ImageLightbox";
import {
  StoreCalendarIcon,
  StoreCarIcon,
  StoreCheckIcon,
  StoreChevronLeftIcon,
  StoreChevronRightIcon,
  StoreColorIcon,
  StoreDoorIcon,
  StoreExpandIcon,
  StoreFuelIcon,
  StoreGearIcon,
  StorePhoneIcon,
  StoreSendIcon,
  StoreSpeedIcon,
  StoreWhatsAppIcon,
} from "@/components/store/StoreIcons";
import { publicService } from "@/services/public.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { VehiclePrice } from "@/components/store/VehiclePrice";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { fuelLabels, transmissionLabels } from "@/utils/labels";
import type { PublicStoreContext } from "@/layouts/PublicStoreLayout";
import type { PublicLeadInterestType } from "@/types";

const INTEREST_OPTIONS: { value: PublicLeadInterestType; label: string; hint: string }[] = [
  { value: "INTEREST", label: "Tenho interesse", hint: "Quero saber mais sobre este veículo" },
  { value: "FINANCING", label: "Simular financiamento", hint: "Entrada, parcelas e condições" },
  { value: "CASH", label: "Pagamento à vista", hint: "Negociar desconto à vista" },
  { value: "TRADE_IN", label: "Avaliar troca", hint: "Usar meu carro como parte do pagamento" },
  { value: "VISIT", label: "Agendar visita", hint: "Ver o carro na loja" },
];

const leadSchema = z.object({
  name: z.string().min(2, "Informe seu nome"),
  phone: z.string().min(8, "Informe um telefone válido"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  interestType: z.enum(["INTEREST", "FINANCING", "CASH", "TRADE_IN", "VISIT"]),
  notes: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

function parseOptionals(raw?: string | null): string[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map(String).map((s) => s.trim()).filter(Boolean);
    }
  } catch {
    // fallback: texto separado por vírgula
  }
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function StoreVehiclePage() {
  const { id, slug: slugParam } = useParams();
  const { company, slug } = useOutletContext<PublicStoreContext>();
  const storeSlug = slug || slugParam || "";
  const basePath = `/loja/${storeSlug}`;
  const [activeImage, setActiveImage] = React.useState(0);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const formRef = React.useRef<HTMLDivElement>(null);
  const settings = (company?.settings ?? {}) as Record<string, any>;
  const whatsapp: string | undefined = settings.whatsapp
    ? String(settings.whatsapp).replace(/\D/g, "")
    : undefined;

  const { data: vehicle, isLoading } = useQuery({
    queryKey: ["public-vehicle", storeSlug, id],
    queryFn: () => publicService.getVehicleBySlug(storeSlug, id as string),
    enabled: !!id && !!storeSlug,
  });

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      interestType: "INTEREST",
      notes: "",
    },
  });

  const interestType = form.watch("interestType");

  const openWhatsAppWithLead = (values: LeadFormValues, asVisit = false) => {
    if (!whatsapp) {
      toast.error("Esta loja ainda não configurou o WhatsApp. Tente ligar ou volte mais tarde.");
      return;
    }

    const interestLabel =
      INTEREST_OPTIONS.find((o) => o.value === values.interestType)?.label ?? values.interestType;
    const vehicleLabel = vehicle
      ? `${vehicle.brand} ${vehicle.model} ${vehicle.year}/${vehicle.yearModel} (${formatCurrency(vehicle.price)})`
      : "veículo";

    const lines = [
      asVisit ? "Olá! Quero agendar uma visita." : "Olá! Tenho interesse neste veículo.",
      "",
      `Veículo: ${vehicleLabel}`,
      `Interesse: ${asVisit ? "Agendar visita" : interestLabel}`,
      `Nome: ${values.name}`,
      `Telefone: ${values.phone}`,
      values.email ? `E-mail: ${values.email}` : null,
      values.notes?.trim() ? `Detalhes: ${values.notes.trim()}` : null,
      typeof window !== "undefined" ? `Link: ${window.location.href}` : null,
    ].filter(Boolean);

    const url = `https://wa.me/${whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`;

    // Registra lead no painel sem bloquear o WhatsApp
    publicService
      .createLeadBySlug(storeSlug, {
        name: values.name,
        phone: values.phone,
        email: values.email || undefined,
        interestType: asVisit ? "VISIT" : values.interestType,
        notes: asVisit ? `[Agendar visita] ${values.notes ?? ""}`.trim() : values.notes,
        vehicleId: id,
      })
      .catch(() => undefined);

    window.open(url, "_blank", "noopener,noreferrer");
    toast.success("Abrindo WhatsApp com suas informações...");
    form.reset({
      name: "",
      phone: "",
      email: "",
      interestType: asVisit ? "VISIT" : "INTEREST",
      notes: "",
    });
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Skeleton className="aspect-[16/10] w-full rounded-lg" />
          <div className="space-y-3">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="mx-auto max-w-4xl px-3 py-16 sm:px-6">
        <EmptyState title="Veículo não encontrado" description="Este anúncio pode não estar mais disponível." />
      </div>
    );
  }

  const images = (vehicle.images ?? []).slice(0, 5);
  const specs = [
    { icon: StoreSpeedIcon, label: "Quilometragem", value: `${formatNumber(vehicle.mileage)} km` },
    { icon: StoreFuelIcon, label: "Combustível", value: fuelLabels[vehicle.fuel] },
    { icon: StoreGearIcon, label: "Câmbio", value: transmissionLabels[vehicle.transmission] },
    { icon: StoreDoorIcon, label: "Portas", value: `${vehicle.doors}` },
    ...(vehicle.color ? [{ icon: StoreColorIcon, label: "Cor", value: vehicle.color }] : []),
    { icon: StoreCalendarIcon, label: "Ano", value: `${vehicle.year}/${vehicle.yearModel}` },
  ];

  const optionals = parseOptionals(vehicle.optionals);

  const notesPlaceholder =
    interestType === "FINANCING"
      ? "Ex: entrada de R$ 20.000, desejo 48 parcelas..."
      : interestType === "TRADE_IN"
        ? "Ex: tenho um Civic 2018, 80 mil km..."
        : interestType === "CASH"
          ? "Ex: quero proposta à vista..."
          : "Mensagem para a loja (opcional)";

  const waMessage = encodeURIComponent(
    `Olá! Tenho interesse no ${vehicle.brand} ${vehicle.model} ${vehicle.year}/${vehicle.yearModel} (${formatCurrency(vehicle.price)}). Gostaria de mais informações.`
  );

  const openLightbox = (index: number) => {
    setActiveImage(index);
    setLightboxOpen(true);
  };

  return (
    <div className="mx-auto max-w-7xl px-3 pb-24 py-4 sm:px-6 sm:pb-8 sm:py-8">
      <nav className="mb-3 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground sm:mb-4">
        <Link to={basePath} className="inline-flex items-center gap-1 hover:text-primary">
          <StoreChevronLeftIcon className="h-3.5 w-3.5" /> Estoque
        </Link>
        <span>/</span>
        <span className="truncate text-foreground">
          {vehicle.brand} {vehicle.model}
        </span>
      </nav>

      <div className="mb-3 lg:hidden">
        <p className="font-display text-xl font-bold uppercase tracking-tight text-[#2e2e2e]">
          {vehicle.brand} {vehicle.model}
        </p>
        {vehicle.version && <p className="mt-0.5 text-sm text-[#696969]">{vehicle.version}</p>}
        <p className="mt-1 text-xs text-[#696969]">
          {vehicle.year}/{vehicle.yearModel}
        </p>
        <VehiclePrice price={vehicle.price} originalPrice={vehicle.originalPrice} size="md" className="mt-2" />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,1fr)] lg:gap-6">
        <div>
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-border bg-white">
            {images.length > 0 ? (
              <button
                type="button"
                onClick={() => openLightbox(activeImage)}
                className="block h-full w-full cursor-zoom-in"
                aria-label="Ver foto em tela cheia"
              >
                <img
                  src={resolveMediaUrl(images[activeImage]?.url)}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-secondary text-muted-foreground/40">
                <StoreCarIcon className="h-14 w-14" />
              </div>
            )}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImage((i) => (i === 0 ? images.length - 1 : i - 1));
                  }}
                  className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-foreground shadow-md transition hover:bg-white sm:left-3 sm:h-10 sm:w-10"
                  aria-label="Foto anterior"
                >
                  <StoreChevronLeftIcon className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImage((i) => (i === images.length - 1 ? 0 : i + 1));
                  }}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-foreground shadow-md transition hover:bg-white sm:right-3 sm:h-10 sm:w-10"
                  aria-label="Próxima foto"
                >
                  <StoreChevronRightIcon className="h-5 w-5" />
                </button>
                <span className="pointer-events-none absolute bottom-2 left-2 inline-flex items-center gap-1 rounded bg-black/70 px-2 py-1 text-[11px] font-medium text-white sm:bottom-3 sm:left-3 sm:text-xs">
                  <StoreExpandIcon className="h-3 w-3" />
                  Ampliar
                </span>
                <span className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-1 text-[11px] font-medium text-white sm:bottom-3 sm:right-3 sm:text-xs">
                  {activeImage + 1}/{images.length}
                </span>
              </>
            )}
            {images.length === 1 && (
              <span className="pointer-events-none absolute bottom-2 left-2 inline-flex items-center gap-1 rounded bg-black/70 px-2 py-1 text-[11px] font-medium text-white">
                <StoreExpandIcon className="h-3 w-3" />
                Ampliar
              </span>
            )}
          </div>

          {images.length > 1 && (
            <div className="-mx-3 mt-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  onDoubleClick={() => openLightbox(index)}
                  className={`h-14 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors sm:h-16 sm:w-[4.5rem] ${
                    index === activeImage ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={resolveMediaUrl(image.url)} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="mt-5 rounded-lg border border-border bg-white p-3.5 sm:mt-6 sm:p-5">
            <h2 className="font-display text-base font-bold">Ficha técnica</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-3 sm:grid-cols-3">
              {specs.map((spec) => (
                <div key={spec.label} className="rounded-md bg-[#f5f5f5] px-2.5 py-2 sm:px-3 sm:py-2.5">
                  <spec.icon className="mb-1 h-4 w-4 text-[#2e2e2e]" />
                  <p className="text-[10px] text-[#696969] sm:text-[11px]">{spec.label}</p>
                  <p className="text-sm font-semibold leading-snug text-[#2e2e2e]">{spec.value}</p>
                </div>
              ))}
            </div>

            {vehicle.description && (
              <div className="mt-5">
                <h3 className="mb-1.5 text-sm font-bold">Descrição</h3>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {vehicle.description}
                </p>
              </div>
            )}

            {optionals.length > 0 && (
              <div className="mt-5">
                <h3 className="mb-2 text-sm font-bold">Itens e opcionais</h3>
                <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {optionals.map((item) => (
                    <li key={item} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <StoreCheckIcon className="h-3.5 w-3.5 shrink-0 text-success" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-20" ref={formRef} id="contato-loja">
          <div className="rounded-lg border border-border bg-white p-4 shadow-[0_8px_24px_-14px_rgb(15_23_42/0.3)] sm:p-5">
            <div className="hidden lg:block">
              <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-[#2e2e2e]">
                {vehicle.brand} {vehicle.model}
              </h1>
              {vehicle.version && <p className="mt-1 text-sm text-[#696969]">{vehicle.version}</p>}
              <p className="mt-1 text-xs text-[#696969]">
                {vehicle.year}/{vehicle.yearModel}
              </p>
              <VehiclePrice
                price={vehicle.price}
                originalPrice={vehicle.originalPrice}
                size="lg"
                className="mt-3"
              />
            </div>

            <div className="flex flex-col gap-2 lg:mt-4">
              <ShareVehicleButton
                className="w-full font-semibold"
                title={`${vehicle.brand} ${vehicle.model} ${vehicle.year}`}
                text={`Olha este ${vehicle.brand} ${vehicle.model} por ${formatCurrency(vehicle.price)}`}
              />
              {whatsapp ? (
                <a
                  href={`https://wa.me/${whatsapp}?text=${waMessage}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden h-11 items-center justify-center gap-2 rounded-md bg-[#25D366] px-4 text-sm font-bold text-white transition hover:bg-[#1ebe57] sm:inline-flex"
                >
                  <StoreWhatsAppIcon className="h-4 w-4" />
                  Falar no WhatsApp
                </a>
              ) : (
                <p className="rounded-md bg-secondary/80 px-3 py-2 text-xs text-muted-foreground sm:block">
                  WhatsApp da loja ainda não configurado. Use o formulário abaixo.
                </p>
              )}
              {company?.phone && (
                <a
                  href={`tel:${company.phone}`}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-white px-4 text-sm font-bold text-foreground transition hover:bg-secondary"
                >
                  <StorePhoneIcon className="h-4 w-4" />
                  {company.phone}
                </a>
              )}
            </div>

            <div className="mt-5 border-t border-border pt-4">
              <p className="mb-1 text-sm font-bold">Fale com a loja</p>
              <p className="mb-3 text-xs text-muted-foreground">
                Preencha e envie. Abrimos o WhatsApp da loja com suas informações.
              </p>
              <form className="space-y-3">
                <div className="space-y-1.5">
                  <Label>O que você deseja?</Label>
                  <div className="grid gap-1.5">
                    {INTEREST_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className={`flex cursor-pointer items-start gap-2.5 rounded-md border px-3 py-2.5 text-sm transition active:scale-[0.99] ${
                          interestType === option.value
                            ? "border-[#2e2e2e] bg-[#f5f5f5]"
                            : "border-border hover:bg-secondary/50"
                        }`}
                      >
                        <input
                          type="radio"
                          className="mt-1"
                          value={option.value}
                          {...form.register("interestType")}
                        />
                        <span>
                          <span className="font-semibold">{option.label}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">{option.hint}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" {...form.register("name")} className="h-11 bg-white text-base sm:text-sm" autoComplete="name" />
                  {form.formState.errors.name && (
                    <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone">Telefone / WhatsApp</Label>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    {...form.register("phone")}
                    placeholder="(11) 99999-9999"
                    className="h-11 bg-white text-base sm:text-sm"
                    autoComplete="tel"
                  />
                  {form.formState.errors.phone && (
                    <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email">E-mail (opcional)</Label>
                  <Input id="email" type="email" {...form.register("email")} className="h-11 bg-white text-base sm:text-sm" autoComplete="email" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="notes">Detalhes</Label>
                  <Textarea
                    id="notes"
                    rows={3}
                    {...form.register("notes")}
                    placeholder={notesPlaceholder}
                    className="bg-white text-base sm:text-sm"
                  />
                </div>
                <Button
                  type="button"
                  className="h-11 w-full font-bold bg-[#25D366] text-white hover:bg-[#1ebe57]"
                  onClick={form.handleSubmit((values) => openWhatsAppWithLead(values, false))}
                  disabled={!whatsapp}
                >
                  <StoreWhatsAppIcon className="h-4 w-4" />
                  Enviar no WhatsApp
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full font-semibold"
                  onClick={form.handleSubmit((values) => openWhatsAppWithLead(values, true))}
                  disabled={!whatsapp}
                >
                  <StoreCalendarIcon className="h-4 w-4" />
                  Agendar visita no WhatsApp
                </Button>
                {!whatsapp && (
                  <p className="text-xs text-muted-foreground">
                    WhatsApp da loja não configurado. Use o telefone acima ou a página de contato.
                  </p>
                )}
              </form>
            </div>
          </div>
        </aside>
      </div>

      <div className="safe-pb fixed inset-x-0 bottom-[3.75rem] z-40 border-t border-border bg-white/95 px-3 pt-2 backdrop-blur-md sm:hidden">
        <div className="mx-auto flex max-w-lg gap-2">
          {whatsapp ? (
            <a
              href={`https://wa.me/${whatsapp}?text=${waMessage}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-md bg-[#25D366] text-sm font-bold text-white"
            >
              <StoreWhatsAppIcon className="h-4 w-4" />
              WhatsApp
            </a>
          ) : null}
          <button
            type="button"
            onClick={scrollToForm}
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-md bg-primary text-sm font-bold text-primary-foreground"
          >
            <StoreSendIcon className="h-4 w-4" />
            Tenho interesse
          </button>
        </div>
      </div>

      <ImageLightbox
        images={images}
        index={activeImage}
        open={lightboxOpen}
        alt={`${vehicle.brand} ${vehicle.model}`}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={setActiveImage}
      />
    </div>
  );
}
