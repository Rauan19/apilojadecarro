import * as React from "react";
import { Link, Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { publicService } from "@/services/public.service";
import { socialIcons } from "@/components/store/SocialIcons";
import {
  StoreChatIcon,
  StoreHomeIcon,
  StorePhoneIcon,
  StorePinIcon,
  StoreWhatsAppIcon,
} from "@/components/store/StoreIcons";
import { buildBrandThemeStyle } from "@/utils/color";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { getActiveSocialLinks } from "@/utils/socialLinks";
import { normalizeHost } from "@/utils/storeHost";
import type { PublicCompanyInfo } from "@/types";

export interface PublicStoreContext {
  company: PublicCompanyInfo | null;
  slug: string;
}

export function PublicStoreLayout() {
  const { slug: slugParam } = useParams();
  const location = useLocation();
  const host = typeof window !== "undefined" ? window.location.hostname : "";

  const { data: hostStore, isFetched: hostFetched } = useQuery({
    queryKey: ["store-resolve-host", host],
    queryFn: () => publicService.resolveByHost(host),
    enabled: !!host && !slugParam,
    retry: false,
  });

  const resolvedSlug = slugParam || hostStore?.slug;

  const {
    data: company,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["public-company", resolvedSlug],
    queryFn: () => publicService.getCompanyBySlug(resolvedSlug!),
    enabled: !!resolvedSlug,
    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
  });

  React.useEffect(() => {
    if (!company?.customDomain || typeof window === "undefined") return;
    const current = normalizeHost(window.location.hostname);
    const target = normalizeHost(company.customDomain);
    if (!target || current === target) return;
    if (current === "localhost" || current === "127.0.0.1") return;
    const path = location.pathname.replace(/^\/loja\/[^/]+/, "") || "/";
    const search = location.search;
    window.location.replace(`https://${company.customDomain}${path === "/" ? "" : path}${search}`);
  }, [company, location.pathname, location.search]);

  if (!slugParam && hostFetched && hostStore?.slug) {
    const rest = location.pathname.replace(/^\/loja\/?/, "") || "";
    const target = `/loja/${hostStore.slug}${rest ? `/${rest}` : ""}${location.search}`;
    return <Navigate to={target} replace />;
  }

  const home = resolvedSlug ? `/loja/${resolvedSlug}` : "/loja";
  const contact = resolvedSlug ? `/loja/${resolvedSlug}/contato` : "/loja/contato";
  const settings = (company?.settings ?? {}) as Record<string, any>;
  const whatsapp: string | undefined = settings.whatsapp
    ? String(settings.whatsapp).replace(/\D/g, "")
    : undefined;
  const locationLabel = company?.city ?? "";
  const socialLinks = getActiveSocialLinks(settings.social);
  const brandStyle = buildBrandThemeStyle(settings.theme?.primaryColor);

  const waitingHost = !slugParam && !hostFetched;
  const missingSlug = !resolvedSlug && hostFetched;
  const path = location.pathname;
  const isHome =
    !!resolvedSlug &&
    (path === `/loja/${resolvedSlug}` || path === `/loja/${resolvedSlug}/`);
  const isContact = !!resolvedSlug && path.includes("/contato");

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-[#f3f3f3]" style={brandStyle}>
      <header className="safe-pt sticky top-0 z-40 border-b border-[#e6e6e6] bg-white shadow-[0_1px_0_rgb(0_0_0/0.04)]">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-3 sm:h-24 sm:gap-4 sm:px-6">
          <Link to={home} className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3.5">
            {company?.logo ? (
              <img
                src={resolveMediaUrl(company.logo)}
                alt={company.name}
                className="h-16 w-auto max-w-[220px] object-contain sm:h-20 sm:max-w-[320px]"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-primary text-base font-bold text-primary-foreground sm:h-20 sm:w-20 sm:text-lg">
                {(company?.name ?? "L").slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 leading-tight">
              <p className="truncate font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
                {isLoading || waitingHost ? "Carregando..." : company?.name ?? "Loja de veículos"}
              </p>
              {locationLabel && (
                <p className="hidden items-center gap-1 truncate text-[11px] text-muted-foreground sm:flex">
                  <StorePinIcon className="h-3 w-3 shrink-0" />
                  {locationLabel}
                </p>
              )}
            </div>
          </Link>

          <nav className="hidden shrink-0 items-center gap-1 text-sm font-semibold sm:flex">
            <Link
              to={home}
              className="rounded-md px-3 py-2 text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
            >
              Comprar
            </Link>
            <Link
              to={contact}
              className="rounded-md px-3 py-2 text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
            >
              Contato
            </Link>
          </nav>
        </div>
      </header>

      <main className="page-fade-in flex-1 pb-[4.5rem] sm:pb-0">
        {waitingHost || (resolvedSlug && isLoading) ? (
          <div className="mx-auto flex max-w-lg flex-col items-center gap-3 px-4 py-24 text-center sm:px-6">
            <p className="text-sm text-muted-foreground">Carregando vitrine da loja...</p>
          </div>
        ) : missingSlug ? (
          <div className="mx-auto flex max-w-lg flex-col items-center gap-3 px-4 py-24 text-center sm:px-6">
            <p className="font-display text-lg font-semibold">Informe a loja</p>
            <p className="text-sm text-muted-foreground">
              Acesse <code className="rounded bg-muted px-1.5 py-0.5">/loja/seu-slug</code> ou configure um
              domínio próprio nas configurações da loja.
            </p>
            <p className="text-sm text-muted-foreground">
              Exemplo demo:{" "}
              <Link to="/loja/autoprme" className="font-semibold text-primary underline-offset-2 hover:underline">
                /loja/autoprme
              </Link>
            </p>
          </div>
        ) : isError ? (
          <div className="mx-auto flex max-w-lg flex-col items-center gap-3 px-4 py-24 text-center sm:px-6">
            <p className="font-display text-lg font-semibold">Loja não encontrada</p>
            <p className="text-sm text-muted-foreground">
              {(error as any)?.response?.data?.message ?? "Verifique o endereço e tente novamente."}
            </p>
          </div>
        ) : (
          <Outlet context={{ company: company ?? null, slug: resolvedSlug! } satisfies PublicStoreContext} />
        )}
      </main>

      {resolvedSlug && company && (
        <nav className="safe-pb fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white/95 backdrop-blur-md sm:hidden">
          <div className="mx-auto grid max-w-lg grid-cols-3 gap-1 px-2 pt-1.5">
            <Link
              to={home}
              className={`flex flex-col items-center gap-0.5 rounded-md px-2 py-2 text-[11px] font-semibold ${
                isHome ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <StoreHomeIcon className="h-5 w-5" />
              Estoque
            </Link>
            <Link
              to={contact}
              className={`flex flex-col items-center gap-0.5 rounded-md px-2 py-2 text-[11px] font-semibold ${
                isContact ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <StoreChatIcon className="h-5 w-5" />
              Contato
            </Link>
            {whatsapp ? (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center gap-0.5 rounded-md px-2 py-2 text-[11px] font-semibold text-[#25D366]"
              >
                <StoreWhatsAppIcon className="h-5 w-5" />
                WhatsApp
              </a>
            ) : company.phone ? (
              <a
                href={`tel:${company.phone}`}
                className="flex flex-col items-center gap-0.5 rounded-md px-2 py-2 text-[11px] font-semibold text-primary"
              >
                <StorePhoneIcon className="h-5 w-5" />
                Ligar
              </a>
            ) : (
              <span className="flex flex-col items-center gap-0.5 rounded-md px-2 py-2 text-[11px] font-semibold text-muted-foreground/40">
                <StorePhoneIcon className="h-5 w-5" />
                Contato
              </span>
            )}
          </div>
        </nav>
      )}

      <footer className="mt-auto border-t border-border bg-[#1a1d23] text-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-2 sm:gap-8 sm:px-6 sm:py-10 lg:grid-cols-4">
          <div>
            <p className="font-display text-base font-bold">{company?.name ?? "Loja de veículos"}</p>
            <p className="mt-2 text-sm leading-relaxed text-white/65">
              {settings.about
                ? String(settings.about).slice(0, 140)
                : "Estoque selecionado, com atendimento direto da loja."}
              {settings.about && String(settings.about).length > 140 ? "…" : ""}
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-white">Atendimento</p>
            {company?.phone && (
              <a href={`tel:${company.phone}`} className="flex items-center gap-2 text-white/75 hover:text-white">
                <StorePhoneIcon className="h-4 w-4 shrink-0" />
                {company.phone}
              </a>
            )}
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-white/75 hover:text-white"
              >
                <StoreWhatsAppIcon className="h-4 w-4 shrink-0" />
                WhatsApp
              </a>
            )}
            {locationLabel && (
              <p className="flex items-center gap-2 text-white/75">
                <StorePinIcon className="h-4 w-4 shrink-0" />
                {locationLabel}
              </p>
            )}
            {settings.businessHours && (
              <p className="text-white/75">{String(settings.businessHours)}</p>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-white">Navegação</p>
            <Link to={home} className="block text-white/75 hover:text-white">
              Estoque
            </Link>
            <Link to={contact} className="block text-white/75 hover:text-white">
              Contato
            </Link>
          </div>
          <div className="space-y-3 text-sm">
            <p className="font-semibold text-white">Redes sociais</p>
            {socialLinks.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {socialLinks.map((item) => {
                  const Icon = socialIcons[item.network];
                  return (
                    <a
                      key={item.network}
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={item.network}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-white/10 text-white transition hover:bg-primary hover:text-primary-foreground sm:h-10 sm:w-10"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            ) : (
              <p className="text-white/45">Configure Instagram, Facebook e outras redes nas configurações da loja.</p>
            )}
          </div>
        </div>
        <div className="border-t border-white/10">
          <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-white/45 sm:px-6">
            &copy; {new Date().getFullYear()} {company?.name ?? "EstoqueAuto"}. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
