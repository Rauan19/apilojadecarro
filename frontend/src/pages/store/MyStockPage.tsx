import { ExternalLink, Store } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { useCompany } from "@/hooks/useCompany";

/** Prévia da vitrine pública — exatamente como o cliente vê o estoque. */
export function MyStockPage() {
  const { companySlug, companyName } = useCompany();

  if (!companySlug) {
    return (
      <div>
        <PageHeader
          title="Ver meu estoque"
          description="Prévia da vitrine pública da sua loja."
        />
        <EmptyState
          title="Loja ainda sem link público"
          description="Defina o slug da loja em Configurações para visualizar o estoque como seus clientes veem."
          action={
            <Button asChild className="mt-2">
              <Link to="/configuracoes">Ir para Configurações</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const storeUrl = `/loja/${companySlug}`;

  return (
    <div className="flex min-h-0 flex-col">
      <PageHeader
        title="Ver meu estoque"
        description={
          companyName
            ? `Assim os clientes veem a vitrine de ${companyName}.`
            : "Assim os clientes veem a vitrine da sua loja."
        }
        actions={
          <Button asChild variant="outline" className="gap-2">
            <a href={storeUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
              Abrir vitrine
            </a>
          </Button>
        }
      />

      <div className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground sm:text-sm">
        <Store className="h-4 w-4 shrink-0" />
        <span>
          Prévia ao vivo da página pública. Alterações no estoque e nas fotos aparecem aqui automaticamente.
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        <iframe
          title="Prévia da vitrine"
          src={storeUrl}
          className="h-[calc(100vh-12.5rem)] w-full border-0 bg-white"
        />
      </div>
    </div>
  );
}
