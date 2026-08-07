import * as React from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { publicService } from "@/services/public.service";
import { socialIcons } from "@/components/store/SocialIcons";
import {
  StoreCarIcon,
  StoreChatIcon,
  StoreClockIcon,
  StoreCloseIcon,
  StorePhoneIcon,
  StorePinIcon,
  StoreSearchIcon,
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

/* Barra inferior com berço (declinação) no meio: a peça central tem largura
   fixa (112px) e as laterais esticam, então a curva nunca deforma. Raio do
   berço 34px contra um botão de 54px — sobra 7px de respiro em toda a volta. */
const NOTCH_W = 112;
const NOTCH_H = 62;
const NOTCH_EDGE =
  "M 0 0.5 H 14.769 A 8 8 0 0 1 22.622 6.976 A 34 34 0 0 0 89.378 6.976 A 8 8 0 0 1 97.231 0.5 H 112";
const NOTCH_FILL = `${NOTCH_EDGE} V ${NOTCH_H} H 0 Z`;

function HeaderNavLink({
  to,
  active,
  children,
}: {
  to: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className={`relative px-3 py-2.5 text-[13px] font-bold uppercase tracking-wide transition-colors ${
        active ? "text-[#12141A]" : "text-[#5c5c5c] hover:text-[#12141A]"
      }`}
    >
      {children}
      <span
        aria-hidden
        className={`absolute inset-x-3 bottom-0.5 h-[3px] -skew-x-12 bg-primary transition-opacity ${
          active ? "opacity-100" : "opacity-0"
        }`}
      />
    </Link>
  );
}

export function PublicStoreLayout() {
  const { slug: slugParam } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
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
  const businessHours = settings.businessHours ? String(settings.businessHours) : "";
  const socialLinks = getActiveSocialLinks(settings.social);
  const storePrimaryColor = settings.theme?.primaryColor as string | undefined;
  const brandStyle = buildBrandThemeStyle(storePrimaryColor);
  // Portais (Sheet do filtro, Dialog, etc.) renderizam em document.body e
  // ficariam com o vermelho padrão do app se as vars ficassem só neste div.
  React.useEffect(() => {
    const vars = buildBrandThemeStyle(storePrimaryColor);
    if (!vars) return;
    const root = document.documentElement;
    const previous = new Map<string, string>();
    for (const [key, value] of Object.entries(vars)) {
      previous.set(key, root.style.getPropertyValue(key));
      root.style.setProperty(key, value);
    }
    return () => {
      for (const [key, value] of previous) {
        if (value) root.style.setProperty(key, value);
        else root.style.removeProperty(key);
      }
    };
  }, [storePrimaryColor]);
  const waHref = whatsapp ? `https://wa.me/${whatsapp}` : undefined;
  const telHref = company?.phone ? `tel:${company.phone.replace(/[^\d+]/g, "")}` : undefined;

  const waitingHost = !slugParam && !hostFetched;
  const missingSlug = !resolvedSlug && hostFetched;
  const path = location.pathname;
  const isHome =
    !!resolvedSlug &&
    (path === `/loja/${resolvedSlug}` || path === `/loja/${resolvedSlug}/`);
  const isContact = !!resolvedSlug && path.includes("/contato");

  // Busca no header: existe uma só. No estoque ela leva ao campo da própria
  // página; nas outras (detalhe do veículo, contato) abre o campo do header,
  // que entrega o termo pela URL.
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [term, setTerm] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  React.useEffect(() => {
    setSearchOpen(false);
  }, [path]);

  const handleSearchClick = () => {
    if (isHome && !searchOpen) {
      const field = document.getElementById("busca-estoque") as HTMLInputElement | null;
      if (field) {
        document.getElementById("estoque")?.scrollIntoView({ behavior: "smooth", block: "start" });
        field.focus({ preventScroll: true });
        return;
      }
    }
    setSearchOpen((open) => !open);
  };

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = term.trim();
    navigate(query ? `${home}?busca=${encodeURIComponent(query)}` : home);
    setSearchOpen(false);
    setTerm("");
  };

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-[#f3f3f3]" style={brandStyle}>
      {/* Faixa da loja: onde fica, quando abre e como falar. Rola com a página —
          só a linha da marca fica fixa. */}
      <div className="safe-pt bg-[#12141A] text-white">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between gap-3 px-3 text-[11px] sm:px-6 sm:text-xs">
          <p className="flex min-w-0 items-center gap-2">
            <span aria-hidden className="h-3 w-1.5 shrink-0 -skew-x-12 bg-primary" />
            <StorePinIcon className="h-3.5 w-3.5 shrink-0 text-white/45" />
            <span className="truncate font-semibold uppercase tracking-wide text-white/90">
              {company ? locationLabel || company.name : "Carregando..."}
            </span>
            {businessHours && (
              <span className="hidden min-w-0 shrink items-center gap-1.5 text-white/60 sm:flex">
                <span aria-hidden className="h-3 w-px shrink-0 bg-white/20" />
                <StoreClockIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{businessHours}</span>
              </span>
            )}
          </p>

          {telHref ? (
            <a
              href={telHref}
              className="flex shrink-0 items-center gap-1.5 font-semibold text-white/90 transition-colors hover:text-white"
            >
              <StorePhoneIcon className="h-3.5 w-3.5 text-primary" />
              {company?.phone}
            </a>
          ) : (
            company && (
              <Link
                to={contact}
                className="shrink-0 font-semibold text-white/90 transition-colors hover:text-white"
              >
                Fale com a loja
              </Link>
            )
          )}
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-[#e6e6e6] bg-white shadow-[0_1px_0_rgb(0_0_0/0.04)]">
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-3 px-3 sm:h-24 sm:gap-4 sm:px-6">
          <Link to={home} className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3.5">
            {company?.logo ? (
              <img
                src={resolveMediaUrl(company.logo)}
                alt={company.name}
                className="h-14 w-auto min-w-0 max-w-[190px] object-contain sm:h-20 sm:max-w-[220px] lg:max-w-[320px]"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-primary text-base font-bold text-primary-foreground sm:h-20 sm:w-20 sm:text-lg">
                {(company?.name ?? "L").slice(0, 2).toUpperCase()}
              </div>
            )}
            {/* Com logo enviada, a imagem já identifica a loja — repetir o nome
                ao lado é redundante. Sem logo, o nome é a única identificação. */}
            {!company?.logo && (
              <p className="min-w-0 truncate font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
                {isLoading || waitingHost ? "Carregando..." : company?.name ?? "Loja de veículos"}
              </p>
            )}
          </Link>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <nav className="hidden items-center sm:flex">
              <HeaderNavLink to={home} active={isHome}>
                Estoque
              </HeaderNavLink>
              <HeaderNavLink to={contact} active={isContact}>
                Contato
              </HeaderNavLink>
            </nav>

            {/* No mobile a busca mora na barra de baixo; aqui ela só aparece a
                partir do sm, onde não existe barra. */}
            <button
              type="button"
              onClick={handleSearchClick}
              aria-expanded={searchOpen}
              aria-label={searchOpen ? "Fechar busca" : "Buscar veículos"}
              className="btn-shape btn-3d btn-3d-soft hidden h-11 w-11 shrink-0 items-center justify-center border border-[#d8d8d8] bg-white text-[#2e2e2e] transition-colors hover:border-[#2e2e2e] sm:flex"
            >
              {searchOpen ? (
                <StoreCloseIcon className="h-[18px] w-[18px]" />
              ) : (
                <StoreSearchIcon className="h-[18px] w-[18px]" />
              )}
            </button>

            {waHref ? (
              <a
                href={waHref}
                target="_blank"
                rel="noreferrer"
                aria-label="Falar no WhatsApp"
                className="btn-shape btn-3d flex h-11 shrink-0 items-center justify-center gap-2 bg-primary px-3 text-[13px] font-bold uppercase tracking-wide text-primary-foreground sm:px-4"
              >
                <StoreWhatsAppIcon className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Falar agora</span>
              </a>
            ) : telHref ? (
              <a
                href={telHref}
                aria-label="Ligar para a loja"
                className="btn-shape btn-3d flex h-11 shrink-0 items-center justify-center gap-2 bg-primary px-3 text-[13px] font-bold uppercase tracking-wide text-primary-foreground sm:px-4"
              >
                <StorePhoneIcon className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Ligar agora</span>
              </a>
            ) : null}
          </div>
        </div>

        {searchOpen && (
          <div className="animate-fade-in border-t border-[#eee] bg-white">
            <form
              onSubmit={submitSearch}
              className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2.5 sm:px-6"
            >
              <div className="relative min-w-0 flex-1">
                <StoreSearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8a8a]" />
                <input
                  ref={searchInputRef}
                  value={term}
                  onChange={(event) => setTerm(event.target.value)}
                  placeholder="Buscar por marca ou modelo"
                  enterKeyHint="search"
                  className="h-11 w-full rounded-md border border-[#d8d8d8] bg-white pl-10 pr-3 text-base text-[#2e2e2e] outline-none transition-colors placeholder:text-[#999] focus:border-[#2e2e2e] sm:text-sm"
                />
              </div>
              <button
                type="submit"
                className="btn-shape btn-3d h-11 shrink-0 bg-primary px-4 text-[13px] font-bold uppercase tracking-wide text-primary-foreground"
              >
                Buscar
              </button>
            </form>
          </div>
        )}
      </header>

      <main className="page-fade-in flex-1 pb-[6.5rem] sm:pb-0">
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
        <nav className="fixed inset-x-0 bottom-0 z-50 sm:hidden">
          <div className="relative">
            {/* Fundo em três peças: lateral esticável, berço de largura fixa,
                lateral esticável. O drop-shadow acompanha o recorte da curva. */}
            <div
              aria-hidden
              className="absolute inset-0 flex flex-col drop-shadow-[0_-4px_14px_rgba(0,0,0,0.10)]"
            >
              <div className="flex h-[62px] shrink-0">
                <span className="flex-1 border-t border-[#e6e6e6] bg-white" />
                <svg
                  viewBox={`0 0 ${NOTCH_W} ${NOTCH_H}`}
                  width={NOTCH_W}
                  height={NOTCH_H}
                  className="block h-[62px] w-[112px] shrink-0"
                >
                  <path d={NOTCH_FILL} fill="#fff" />
                  <path d={NOTCH_EDGE} fill="none" stroke="#e6e6e6" strokeWidth="1" />
                </svg>
                <span className="flex-1 border-t border-[#e6e6e6] bg-white" />
              </div>
              <span className="flex-1 bg-white" />
            </div>

            {/* O berço é da busca — a ação que o visitante mais repete. Falar
                com a loja tem botão próprio no header. */}
            <button
              type="button"
              onClick={handleSearchClick}
              aria-expanded={searchOpen}
              aria-label={searchOpen ? "Fechar busca" : "Buscar veículos"}
              className="absolute left-1/2 top-0 z-10 flex h-[54px] w-[54px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_18px_-6px_rgba(0,0,0,0.45)] transition-transform active:scale-95"
            >
              {searchOpen ? (
                <StoreCloseIcon className="h-6 w-6" />
              ) : (
                <StoreSearchIcon className="h-6 w-6" />
              )}
            </button>

            <div className="safe-pb relative mx-auto grid max-w-lg grid-cols-3">
              <Link
                to={home}
                className={`relative flex h-[62px] flex-col items-center justify-center gap-1 text-[11px] font-bold ${
                  isHome ? "text-primary" : "text-[#6b6b6b]"
                }`}
              >
                {isHome && (
                  <span aria-hidden className="absolute left-1/2 top-0 h-[3px] w-8 -translate-x-1/2 -skew-x-12 bg-primary" />
                )}
                <StoreCarIcon className="h-[22px] w-[22px]" />
                Estoque
              </Link>

              {/* Rótulo do berço: alvo de toque extra para o botão acima, que
                  já carrega o nome acessível. */}
              <button
                type="button"
                onClick={handleSearchClick}
                aria-hidden
                tabIndex={-1}
                className="flex h-[62px] flex-col items-center justify-end pb-2.5 text-[11px] font-bold text-primary"
              >
                {searchOpen ? "Fechar" : "Buscar"}
              </button>

              <Link
                to={contact}
                className={`relative flex h-[62px] flex-col items-center justify-center gap-1 text-[11px] font-bold ${
                  isContact ? "text-primary" : "text-[#6b6b6b]"
                }`}
              >
                {isContact && (
                  <span aria-hidden className="absolute left-1/2 top-0 h-[3px] w-8 -translate-x-1/2 -skew-x-12 bg-primary" />
                )}
                <StoreChatIcon className="h-[22px] w-[22px]" />
                Contato
              </Link>
            </div>
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
