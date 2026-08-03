import * as React from "react";
import { Link, Outlet, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Car, Loader2, MessageCircle, Phone, Share2 } from "lucide-react";
import { publicService } from "@/services/public.service";
import { getPublicToken } from "@/utils/publicToken";
import type { PublicCompanyInfo } from "@/types";

export interface PublicStoreContext {
  company: PublicCompanyInfo | null;
  token: string;
  slug?: string;
}

export function PublicStoreLayout() {
  const { slug } = useParams();
  const token = getPublicToken();

  const { data: company, isLoading } = useQuery({
    queryKey: ["public-company", token],
    queryFn: () => publicService.getCompanyInfo(token),
    enabled: !!token,
    retry: false,
  });

  const settings = (company?.settings ?? {}) as Record<string, any>;
  const whatsapp: string | undefined = settings.whatsapp;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-30 border-b border-border bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to={slug ? `/loja/${slug}` : "/loja"} className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Car className="h-5 w-5" />
            </div>
            <div className="leading-none">
              <p className="font-display text-base font-bold tracking-tight">
                {isLoading ? "Carregando..." : company?.name ?? "LojaDeCarro"}
              </p>
              <p className="text-[11px] text-muted-foreground">{company?.city ?? "Loja de veículos"}</p>
            </div>
          </Link>

          <nav className="flex items-center gap-1 text-sm font-medium">
            <Link
              to={slug ? `/loja/${slug}` : "/loja"}
              className="rounded-md px-3 py-2 text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
            >
              Estoque
            </Link>
            <Link
              to={slug ? `/loja/${slug}/contato` : "/loja/contato"}
              className="rounded-md px-3 py-2 text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
            >
              Contato
            </Link>
          </nav>
        </div>
      </header>

      <main className="page-fade-in flex-1">
        {!token ? (
          <div className="mx-auto flex max-w-lg flex-col items-center gap-3 px-6 py-24 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="font-display text-lg font-semibold">Configuração necessária</p>
            <p className="text-sm text-muted-foreground">
              Defina <code className="rounded bg-muted px-1.5 py-0.5">VITE_DEMO_API_TOKEN</code> no arquivo .env para
              exibir a loja pública com dados reais da API.
            </p>
          </div>
        ) : (
          <Outlet context={{ company: company ?? null, token, slug } satisfies PublicStoreContext} />
        )}
      </main>

      <footer className="border-t border-border bg-secondary/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <p>
            &copy; {new Date().getFullYear()} {company?.name ?? "LojaDeCarro"}. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4">
            {company?.phone && (
              <a href={`tel:${company.phone}`} className="flex items-center gap-1.5 hover:text-foreground">
                <Phone className="h-4 w-4" /> {company.phone}
              </a>
            )}
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 hover:text-foreground"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            )}
            {settings.social?.instagram && (
              <a
                href={`https://instagram.com/${String(settings.social.instagram).replace("@", "")}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 hover:text-foreground"
              >
                <Share2 className="h-4 w-4" /> Instagram
              </a>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
