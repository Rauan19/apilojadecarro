import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { companiesService } from "@/services/companies.service";
import { plansService } from "@/services/plans.service";
import { getApiErrorMessage } from "@/services/api";
import { formatCurrency, cn } from "@/lib/utils";
import type { Company } from "@/types";

export function ChangePlanDialog({
  open,
  onOpenChange,
  company,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
}) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = React.useState<string>("");

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["plans", "active"],
    queryFn: () => plansService.list(true),
    enabled: open,
  });

  React.useEffect(() => {
    if (open && company) {
      setSelected(company.planId ?? company.plan?.id ?? "");
    }
  }, [open, company]);

  const mutation = useMutation({
    mutationFn: (planId: string) => companiesService.changePlan(company!.id, planId),
    onSuccess: () => {
      toast.success("Plano atualizado");
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["companies-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      onOpenChange(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Definir plano</DialogTitle>
          <DialogDescription>
            Escolha um dos planos que você criou para {company?.name ?? "este cliente"}.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando planos...</p>
        ) : plans.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum plano ativo. Crie planos em <strong>Planos</strong> antes de atribuir.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {plans.map((plan) => {
              const active = selected === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelected(plan.id)}
                  className={cn(
                    "rounded-lg border p-4 text-left transition-colors",
                    active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{plan.name}</p>
                      <p className="mt-1 text-lg font-semibold text-primary">
                        {formatCurrency(plan.priceMonthly)}
                        <span className="text-xs font-normal text-muted-foreground">/mês</span>
                      </p>
                    </div>
                    {active ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    ) : company?.planId === plan.id ? (
                      <Badge variant="secondary">Atual</Badge>
                    ) : null}
                  </div>
                  <ul className="mt-3 space-y-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="text-xs text-muted-foreground">
                        • {feature}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            loading={mutation.isPending}
            disabled={!company || !selected || selected === company.planId}
            onClick={() => mutation.mutate(selected)}
          >
            Aplicar plano
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
