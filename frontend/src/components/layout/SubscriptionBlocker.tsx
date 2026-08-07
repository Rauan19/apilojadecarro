import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Copy, Lock, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { billingService } from "@/services/billing.service";
import { getApiErrorMessage } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatDate } from "@/lib/utils";

/**
 * Tela cheia que cobre o painel quando a loja está bloqueada por falta de
 * pagamento. Não tem como fechar: a única saída é pagar o PIX — ou sair.
 *
 * O bloqueio de verdade é do backend (402 no SubscriptionGuard); isto aqui é
 * a cara dele, para o dono da loja entender e resolver.
 */
export function SubscriptionBlocker({ companyId }: { companyId?: string }) {
  const queryClient = useQueryClient();
  const { logout } = useAuth();
  const [copied, setCopied] = React.useState(false);

  const { data: subscription } = useQuery({
    queryKey: ["billing-subscription", companyId],
    queryFn: () => billingService.getSubscription(companyId),
    // O pagamento chega por webhook: repetir a consulta é o que faz a tela
    // sumir sozinha assim que o PIX cai. Continua em segundo plano porque o
    // normal é pagar no celular com esta aba fora de foco.
    refetchInterval: 8000,
    refetchIntervalInBackground: true,
  });

  const invoice = subscription?.openInvoice ?? null;
  const pixValid = Boolean(
    invoice?.pixQrCode &&
      invoice.pixExpiresAt &&
      new Date(invoice.pixExpiresAt).getTime() > Date.now()
  );

  // Bloqueio manual do Super Admin não se resolve pagando: mostrar PIX aqui
  // faria a loja pagar achando que ia liberar.
  const isBillingBlock = subscription?.blockedByBilling ?? true;

  const refreshPixMutation = useMutation({
    mutationFn: (invoiceId: string) => billingService.refreshPix(invoiceId, companyId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["billing-subscription", companyId] });
      toast.success("Novo PIX gerado");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const subscribeMutation = useMutation({
    mutationFn: (planId: string) => billingService.subscribe(planId, companyId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["billing-subscription", companyId] });
      toast.success("PIX gerado — pague para liberar o sistema");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  async function copyPix(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      toast.success("Código PIX copiado");
    } catch {
      toast.error("Não consegui copiar. Selecione o código e copie manualmente.");
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-background/95 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-lg rounded-xl border border-border bg-white p-6 shadow-lg dark:bg-card">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-destructive/10 p-2">
            <Lock className="h-5 w-5 text-destructive" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold">
              {isBillingBlock ? "Assinatura pendente" : "Acesso suspenso"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isBillingBlock
                ? "O acesso ao sistema está suspenso até a mensalidade ser paga. Seus dados estão salvos e voltam assim que o pagamento cair."
                : "Sua conta foi suspensa pela administração. Fale com o suporte para reativar — seus dados continuam salvos."}
            </p>
          </div>
        </div>

        {isBillingBlock && subscription && (
          <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Plano</span>
              <span className="font-medium">{subscription.plan.name}</span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Mensalidade</span>
              <span className="font-medium">
                {formatCurrency(subscription.plan.priceMonthly)}
              </span>
            </div>
            {subscription.currentPeriodEnd && (
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Venceu em</span>
                <span className="font-medium">
                  {formatDate(subscription.currentPeriodEnd)}
                </span>
              </div>
            )}
          </div>
        )}

        {!isBillingBlock ? null : pixValid && invoice ? (
          <div className="mt-4 space-y-3">
            {invoice.pixQrCodeBase64 && (
              <div className="flex justify-center">
                <img
                  src={`data:image/png;base64,${invoice.pixQrCodeBase64}`}
                  alt="QR Code do PIX"
                  className="h-52 w-52 rounded-md border border-border bg-white p-2"
                />
              </div>
            )}
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                PIX copia e cola
              </p>
              <div className="flex gap-2">
                <code className="min-w-0 flex-1 truncate rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-xs">
                  {invoice.pixQrCode}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyPix(invoice.pixQrCode as string)}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Pague pelo app do banco. Esta tela libera sozinha em alguns segundos
              após a confirmação.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3 text-center">
            <p className="text-sm text-muted-foreground">
              {invoice
                ? "O QR Code desta cobrança venceu. Gere um novo para pagar."
                : "Nenhuma cobrança em aberto. Gere o PIX para regularizar."}
            </p>
            {invoice ? (
              <Button
                type="button"
                className="w-full"
                loading={refreshPixMutation.isPending}
                onClick={() => refreshPixMutation.mutate(invoice.id)}
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Gerar novo PIX
              </Button>
            ) : (
              subscription && (
                <Button
                  type="button"
                  className="w-full"
                  loading={subscribeMutation.isPending}
                  onClick={() => subscribeMutation.mutate(subscription.plan.id)}
                >
                  Gerar PIX de {formatCurrency(subscription.plan.priceMonthly)}
                </Button>
              )
            )}
          </div>
        )}

        <div className="mt-5 border-t border-border pt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => logout()}
          >
            <LogOut className="mr-2 h-4 w-4" /> Sair da conta
          </Button>
        </div>
      </div>
    </div>
  );
}
