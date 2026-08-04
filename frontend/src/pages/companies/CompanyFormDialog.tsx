import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Copy } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MaskedInput } from "@/components/ui/masked-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { companiesService } from "@/services/companies.service";
import { plansService } from "@/services/plans.service";
import { getApiErrorMessage } from "@/services/api";
import {
  maskCep,
  maskDocument,
  maskPhone,
  maskState,
  normalizeWebsite,
} from "@/lib/masks";
import {
  optionalCepSchema,
  optionalDocumentSchema,
  optionalPhoneSchema,
  optionalStateSchema,
  optionalWebsiteSchema,
  requiredEmailSchema,
} from "@/lib/form-schemas";
import { formatCurrency } from "@/lib/utils";
import type { Company, CreateCompanyResult } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Informe o nome do cliente"),
  slug: z.string().optional(),
  email: requiredEmailSchema,
  document: optionalDocumentSchema,
  phone: optionalPhoneSchema,
  website: optionalWebsiteSchema,
  customDomain: z.string().optional(),
  primaryColor: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: optionalStateSchema,
  zipCode: optionalCepSchema,
  planId: z.string().min(1, "Selecione um plano"),
  adminName: z.string().optional(),
  adminEmail: z.string().optional(),
  adminPassword: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface CompanyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: Company | null;
  onCreatedLink?: (payload: { url: string; adminEmail: string }) => void;
}

export function CompanyFormDialog({
  open,
  onOpenChange,
  company,
  onCreatedLink,
}: CompanyFormDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!company;

  const { data: plans = [] } = useQuery({
    queryKey: ["plans", "active"],
    queryFn: () => plansService.list(true),
    enabled: open,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(
      isEditing
        ? schema
        : schema.extend({
            adminPassword: z.string().min(6, "Senha com no mínimo 6 caracteres"),
            adminEmail: z
              .string()
              .email("E-mail inválido")
              .optional()
              .or(z.literal("")),
          }),
    ),
  });

  React.useEffect(() => {
    if (open) {
      reset({
        name: company?.name ?? "",
        slug: company?.slug ?? "",
        email: company?.email ?? "",
        document: company?.document ? maskDocument(company.document) : "",
        phone: company?.phone ? maskPhone(company.phone) : "",
        website: company?.website ?? "",
        customDomain: company?.customDomain ?? "",
        primaryColor: "#e10600",
        address: company?.address ?? "",
        city: company?.city ?? "",
        state: company?.state ?? "",
        zipCode: company?.zipCode ? maskCep(company.zipCode) : "",
        planId: company?.planId ?? company?.plan?.id ?? "",
        adminName: "",
        adminEmail: "",
        adminPassword: "",
      });
    }
  }, [open, company, reset]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues): Promise<Company | CreateCompanyResult> => {
      const color = values.primaryColor?.trim() || "#e10600";
      const base = {
        name: values.name,
        slug: values.slug || undefined,
        website: normalizeWebsite(values.website),
        customDomain: values.customDomain?.trim() || undefined,
        document: values.document || undefined,
        phone: values.phone || undefined,
        address: values.address || undefined,
        city: values.city || undefined,
        zipCode: values.zipCode || undefined,
        state: values.state?.toUpperCase() || undefined,
        planId: values.planId,
        email: values.email,
      };

      if (isEditing) {
        return companiesService.update(company!.id, base);
      }

      return companiesService.create({
        ...base,
        settings: JSON.stringify({
          theme: { primaryColor: color, secondaryColor: color },
        }),
        adminName: values.adminName || undefined,
        adminEmail: values.adminEmail || undefined,
        adminPassword: values.adminPassword!,
      });
    },
    onSuccess: (result) => {
      toast.success(isEditing ? "Cliente atualizado com sucesso" : "Cliente criado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onOpenChange(false);

      if (!isEditing && "passwordChangeUrl" in result) {
        const created = result as CreateCompanyResult;
        onCreatedLink?.({
          url: created.passwordChangeUrl,
          adminEmail: created.admin.email,
        });
      }
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize as informações da loja/concessionária."
              : "Cadastre a loja com login e senha do admin. Depois você pode enviar o link para ele trocar a senha."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Nome do cliente</Label>
              <Input id="name" {...register("name")} placeholder="Auto Center São Paulo" autoComplete="organization" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail da loja</Label>
              <Input id="email" type="email" inputMode="email" {...register("email")} placeholder="contato@loja.com.br" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug (opcional)</Label>
              <Input id="slug" {...register("slug")} placeholder="auto-center-sp" />
              <p className="text-[11px] text-muted-foreground">Vitrine em /loja/seu-slug</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="primaryColor">Cor da marca</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-10 w-12 cursor-pointer rounded border border-border bg-white p-1"
                  {...register("primaryColor")}
                />
                <Input {...register("primaryColor")} placeholder="#e10600" className="font-mono" />
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="customDomain">Domínio próprio (opcional)</Label>
              <Input id="customDomain" {...register("customDomain")} placeholder="www.minhaloja.com.br" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="document">CNPJ/CPF</Label>
              <MaskedInput
                id="document"
                inputMode="numeric"
                placeholder="00.000.000/0000-00"
                value={watch("document") ?? ""}
                mask={maskDocument}
                onValueChange={(v) => setValue("document", v, { shouldValidate: true })}
              />
              {errors.document && <p className="text-xs text-destructive">{errors.document.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefone</Label>
              <MaskedInput
                id="phone"
                type="tel"
                inputMode="tel"
                placeholder="(11) 99999-9999"
                value={watch("phone") ?? ""}
                mask={maskPhone}
                onValueChange={(v) => setValue("phone", v, { shouldValidate: true })}
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>Plano</Label>
              {plans.length === 0 ? (
                <p className="rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
                  Nenhum plano ativo. Crie planos em <strong>Planos</strong> antes de cadastrar o cliente.
                </p>
              ) : (
                <Select value={watch("planId") || undefined} onValueChange={(value) => setValue("planId", value, { shouldValidate: true })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {`${plan.name} · ${formatCurrency(plan.priceMonthly)}/mês`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.planId && <p className="text-xs text-destructive">{errors.planId.message}</p>}
            </div>

            {!isEditing && (
              <>
                <div className="sm:col-span-2 border-t border-border pt-3">
                  <p className="text-sm font-medium">Acesso do admin da loja</p>
                  <p className="text-xs text-muted-foreground">
                    Ele entra com este e-mail e senha. Você também pode mandar o link de troca de senha.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="adminName">Nome do admin</Label>
                  <Input id="adminName" {...register("adminName")} placeholder="Administrador" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="adminEmail">E-mail de login</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    {...register("adminEmail")}
                    placeholder="Se vazio, usa o e-mail da loja"
                  />
                  {errors.adminEmail && <p className="text-xs text-destructive">{errors.adminEmail.message}</p>}
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="adminPassword">Senha inicial</Label>
                  <Input id="adminPassword" type="password" autoComplete="new-password" {...register("adminPassword")} />
                  {errors.adminPassword && <p className="text-xs text-destructive">{errors.adminPassword.message}</p>}
                </div>
              </>
            )}

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" type="url" inputMode="url" {...register("website")} placeholder="https://loja.com.br" />
              {errors.website && <p className="text-xs text-destructive">{errors.website.message}</p>}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="address">Endereço</Label>
              <Input id="address" {...register("address")} placeholder="Av. Paulista, 1000" autoComplete="street-address" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="city">Cidade</Label>
              <Input id="city" {...register("city")} placeholder="São Paulo" autoComplete="address-level2" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="state">UF</Label>
              <MaskedInput
                id="state"
                placeholder="SP"
                value={watch("state") ?? ""}
                mask={maskState}
                onValueChange={(v) => setValue("state", v, { shouldValidate: true })}
              />
              {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="zipCode">CEP</Label>
              <MaskedInput
                id="zipCode"
                inputMode="numeric"
                placeholder="00000-000"
                value={watch("zipCode") ?? ""}
                mask={maskCep}
                onValueChange={(v) => setValue("zipCode", v, { shouldValidate: true })}
              />
              {errors.zipCode && <p className="text-xs text-destructive">{errors.zipCode.message}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              {isEditing ? "Salvar alterações" : "Criar cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PasswordLinkDialog({
  open,
  onOpenChange,
  url,
  adminEmail,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  adminEmail?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copiado");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Link para alterar senha</DialogTitle>
          <DialogDescription>
            Envie este link para {adminEmail ?? "o admin da loja"}. Ele vale por 48 horas.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input readOnly value={url} className="font-mono text-xs" />
          <Button type="button" variant="outline" onClick={copy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
