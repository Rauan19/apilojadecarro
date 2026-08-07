import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { billingService } from "@/services/billing.service";
import { SUBSCRIPTION_BLOCKED_EVENT } from "@/services/api";
import { useCompany } from "@/hooks/useCompany";

/**
 * Diz se a loja está bloqueada por falta de pagamento.
 *
 * Escuta duas fontes porque elas cobrem momentos diferentes: o 402 pega o
 * bloqueio que acontece no meio da sessão, e a consulta da assinatura resolve
 * o caso de já entrar bloqueado (e é ela que desfaz o bloqueio no pagamento).
 */
export function useSubscriptionBlocked(): boolean {
  const { companyId, isSuperAdmin } = useCompany();
  const [sawPaymentRequired, setSawPaymentRequired] = React.useState(false);

  const { data: subscription } = useQuery({
    queryKey: ["billing-subscription", companyId],
    queryFn: () => billingService.getSubscription(companyId),
    enabled: !!companyId && !isSuperAdmin,
    refetchInterval: sawPaymentRequired ? 8000 : false,
    refetchIntervalInBackground: true,
  });

  React.useEffect(() => {
    if (isSuperAdmin) return;
    const onBlocked = () => setSawPaymentRequired(true);
    window.addEventListener(SUBSCRIPTION_BLOCKED_EVENT, onBlocked);
    return () => window.removeEventListener(SUBSCRIPTION_BLOCKED_EVENT, onBlocked);
  }, [isSuperAdmin]);

  // A assinatura é a fonte da verdade: assim que o pagamento entra, ela volta
  // como ACTIVE e a tela de bloqueio sai sozinha.
  React.useEffect(() => {
    if (subscription && subscription.companyStatus !== "BLOCKED") {
      setSawPaymentRequired(false);
    }
  }, [subscription]);

  if (isSuperAdmin) return false;

  return subscription?.companyStatus === "BLOCKED" || sawPaymentRequired;
}
