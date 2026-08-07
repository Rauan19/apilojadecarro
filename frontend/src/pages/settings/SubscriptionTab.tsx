import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Check, Copy, QrCode, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { billingService, type Invoice, type Subscription } from "@/services/billing.service";
import { getApiErrorMessage } from "@/services/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { SubscriptionPlan } from "@/types";

const SUBSCRIPTION_LABELS: Record<Subscription["status"], { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
  ACTIVE: { label: "Ativa", variant: "success" },
  PENDING: { label: "Aguardando pagamento", variant: "warning" },
  PAST_DUE: { label: "Vencida", variant: "destructive" },
  CANCELED: { label: "Cancelada", variant: "secondary" },
};

const INVOICE_LABELS: Record<Invoice["status"], { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
  PAID: { label: "Paga", variant: "success" },
  PENDING: { label: "Aguardando", variant: "warning" },
  EXPIRED: { label: "Vencida", variant: "destructive" },
  CANCELED: { label: "Cancelada", variant: "secondary" },
  REFUNDED: { label: "Estornada", variant: "secondary" },
};

/** Texto do botão de cada plano, conforme a situação da assinatura. */
function planActionLabel(
  isCurrent: boolean,
  status: Subscription["status"] | undefined
): string {
  if (!isCurrent) return "Assinar";
  switch (status) {
    case "ACTIVE":
      return "Plano atual";
    // Já existe PIX aberto logo acima — mandar "assinar" de novo só confunde.
    case "PENDING":
      return "Aguardando pagamento";
    case "PAST_DUE":
      return "Gerar novo PIX";
    default:
      return "Reativar";
  }
}

/** Fatura em aberto com QR Code ainda dentro da validade. */
function isPixValid(invoice: Invoice | null): boolean {
  return Boolean(
    invoice &&
      invoice.status === "PENDING" &&
      invoice.pixQrCode &&
      invoice.pixExpiresAt &&
      new Date(invoice.pixExpiresAt).getTime() > Date.now()
  );
}

export function SubscriptionTab({ companyId }: { companyId?: string }) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = React.useState(false);

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["billing-subscription", companyId],
    queryFn: () => billingService.getSubscription(companyId),
    // Enquanto o PIX está aberto, o pagamento chega por webhook: repetir a
    // consulta é o que faz a tela virar "Ativa" sozinha após o pagamento.
    refetchInterval: (query) => (query.state.data?.openInvoice ? 10000 : false),
  });

  const { data: plans } = useQuery({
    queryKey: ["billing-plans"],
    queryFn: () => billingService.listPlans(),
  });

  const { data: invoices } = useQuery({
    queryKey: ["billing-invoices", companyId],
    queryFn: () => billingService.listInvoices(companyId),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["billing-subscription", companyId] });
    void queryClient.invalidateQueries({ queryKey: ["billing-invoices", companyId] });
  };

  const subscribeMutation = useMutation({
    mutationFn: (planId: string) => billingService.subscribe(planId, companyId),
    onSuccess: (result) => {
      queryClient.setQueryData(["billing-subscription", companyId], result);
      void queryClient.invalidateQueries({ queryKey: ["billing-invoices", companyId] });
      toast.success(
        result.openInvoice
          ? "PIX gerado — pague para ativar o plano"
          : "Plano atualizado com sucesso"
      );
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const refreshPixMutation = useMutation({
    mutationFn: (invoiceId: string) => billingService.refreshPix(invoiceId, companyId),
    onSuccess: () => {
      invalidate();
      toast.success("Novo PIX gerado");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const cancelMutation = useMutation({
    mutationFn: () => billingService.cancel(companyId),
    onSuccess: (result) => {
      queryClient.setQueryData(["billing-subscription", companyId], result);
      void queryClient.invalidateQueries({ queryKey: ["billing-invoices", companyId] });
      toast.success("Renovação cancelada — o plano vale até o fim do ciclo");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const openInvoice = subscription?.openInvoice ?? null;
  const pixReady = isPixValid(openInvoice);
  const availablePlans: SubscriptionPlan[] = plans ?? [];
  const invoiceHistory: Invoice[] = invoices ?? [];

  async function copyPixCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Código PIX copiado");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não consegui copiar. Selecione o código e copie manualmente.");
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Carregando assinatura...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {subscription?.companyStatus === "BLOCKED" && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div className="text-sm">
              <p className="font-semibold text-destructive">Loja bloqueada por falta de pagamento</p>
              <p className="text-muted-foreground">
                Pague o PIX abaixo para liberar o sistema na hora.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {subscription && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>Plano {subscription.plan.name}</CardTitle>
                <CardDescription>
                  {formatCurrency(subscription.plan.priceMonthly)} por mês
                </CardDescription>
              </div>
              <Badge variant={SUBSCRIPTION_LABELS[subscription.status].variant}>
                {SUBSCRIPTION_LABELS[subscription.status].label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <p className="text-muted-foreground">Ciclo atual</p>
                <p className="font-medium">
                  {subscription.currentPeriodStart
                    ? `${formatDate(subscription.currentPeriodStart)} a ${formatDate(subscription.currentPeriodEnd)}`
                    : "Ainda não iniciado"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Próxima cobrança</p>
                <p className="font-medium">
                  {subscription.nextChargeAt ? formatDate(subscription.nextChargeAt) : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Dias restantes</p>
                <p className="font-medium">
                  {subscription.daysRemaining === null
                    ? "—"
                    : subscription.daysRemaining >= 0
                      ? `${subscription.daysRemaining} dia(s)`
                      : `vencido há ${Math.abs(subscription.daysRemaining)} dia(s)`}
                </p>
              </div>
            </div>

            {subscription.status === "PAST_DUE" && subscription.graceUntil && (
              <p className="rounded-md bg-warning/10 px-3 py-2 text-xs text-muted-foreground">
                Sua loja continua liberada até <strong>{formatDate(subscription.graceUntil)}</strong>.
                Depois disso o acesso é bloqueado até o pagamento.
              </p>
            )}

            {subscription.status === "CANCELED" && (
              <p className="text-xs text-muted-foreground">
                Renovação cancelada. Escolha um plano abaixo para voltar a assinar.
              </p>
            )}

            {subscription.status !== "CANCELED" && (
              <div className="pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  loading={cancelMutation.isPending}
                  onClick={() => cancelMutation.mutate()}
                >
                  Cancelar renovação
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {openInvoice && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-4 w-4" /> Pagar {formatCurrency(openInvoice.amount)} via PIX
            </CardTitle>
            <CardDescription>
              Libera o ciclo de {formatDate(openInvoice.periodStart)} a {formatDate(openInvoice.periodEnd)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pixReady ? (
              <>
                <div className="flex flex-col items-center gap-3">
                  {openInvoice.pixQrCodeBase64 && (
                    <img
                      src={`data:image/png;base64,${openInvoice.pixQrCodeBase64}`}
                      alt="QR Code do PIX"
                      className="h-56 w-56 rounded-md border border-border bg-white p-2"
                    />
                  )}
                  <p className="text-center text-xs text-muted-foreground">
                    Abra o app do banco → PIX → Ler QR Code. A confirmação é automática,
                    esta tela atualiza sozinha.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">PIX copia e cola</p>
                  <div className="flex gap-2">
                    <code className="min-w-0 flex-1 truncate rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-xs">
                      {openInvoice.pixQrCode}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyPixCode(openInvoice.pixQrCode as string)}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  {openInvoice.pixExpiresAt && (
                    <p className="text-xs text-muted-foreground">
                      Válido até {formatDate(openInvoice.pixExpiresAt)}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-3 text-center">
                <p className="text-sm text-muted-foreground">
                  O QR Code desta cobrança venceu. Gere um novo para pagar.
                </p>
                <Button
                  type="button"
                  loading={refreshPixMutation.isPending}
                  onClick={() => refreshPixMutation.mutate(openInvoice.id)}
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Gerar novo PIX
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{subscription ? "Trocar de plano" : "Escolha seu plano"}</CardTitle>
          <CardDescription>
            {subscription?.status === "ACTIVE"
              ? "A troca vale a partir do próximo ciclo, sem cobrança proporcional."
              : "Ao assinar, o PIX do primeiro mês é gerado na hora."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {availablePlans.map((plan) => {
            const isCurrent = subscription?.plan.id === plan.id;
            return (
              <div
                key={plan.id}
                className={`flex flex-col rounded-lg border p-4 ${
                  isCurrent ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{plan.name}</p>
                  {isCurrent && <Badge variant="default">Atual</Badge>}
                </div>
                {plan.companyId && (
                  <Badge variant="outline" className="mt-1 w-fit">
                    Exclusivo da sua loja
                  </Badge>
                )}
                <p className="mt-1 text-2xl font-bold">
                  {formatCurrency(plan.priceMonthly)}
                  <span className="text-sm font-normal text-muted-foreground">/mês</span>
                </p>
                {plan.description && (
                  <p className="mt-1 text-xs text-muted-foreground">{plan.description}</p>
                )}
                {plan.features.length > 0 && (
                  <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-1.5">
                        <Check className="mt-0.5 h-3 w-3 shrink-0 text-success" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-4 pt-1">
                  <Button
                    type="button"
                    className="w-full"
                    variant={isCurrent ? "outline" : "default"}
                    disabled={
                      isCurrent &&
                      (subscription?.status === "ACTIVE" ||
                        subscription?.status === "PENDING")
                    }
                    loading={
                      subscribeMutation.isPending && subscribeMutation.variables === plan.id
                    }
                    onClick={() => subscribeMutation.mutate(plan.id)}
                  >
                    {planActionLabel(isCurrent, subscription?.status)}
                  </Button>
                </div>
              </div>
            );
          })}
          {availablePlans.length === 0 && (
            <p className="text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
              Nenhum plano disponível no momento.
            </p>
          )}
        </CardContent>
      </Card>

      {invoiceHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de faturas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {invoiceHistory.map((invoice, index) => (
              <div key={invoice.id}>
                {index > 0 && <Separator />}
                <div className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <div>
                    <p className="font-medium">{formatCurrency(invoice.amount)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(invoice.periodStart)} a {formatDate(invoice.periodEnd)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {invoice.paidAt && (
                      <span className="text-xs text-muted-foreground">
                        Pago em {formatDate(invoice.paidAt)}
                      </span>
                    )}
                    <Badge variant={INVOICE_LABELS[invoice.status].variant}>
                      {INVOICE_LABELS[invoice.status].label}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
