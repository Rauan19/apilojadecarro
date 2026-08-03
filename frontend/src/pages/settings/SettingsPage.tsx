import * as React from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CardSkeleton } from "@/components/shared/LoadingPage";
import { settingsService } from "@/services/settings.service";
import { getApiErrorMessage } from "@/services/api";
import { useCompany } from "@/hooks/useCompany";

interface FormValues {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  website: string;
  about: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
  businessHours: string;
}

export function SettingsPage() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["settings", companyId],
    queryFn: () => settingsService.get(companyId),
  });

  const { register, handleSubmit, reset } = useForm<FormValues>();

  React.useEffect(() => {
    if (data) {
      const settings = (data.settings ?? {}) as Record<string, any>;
      reset({
        name: data.name ?? "",
        email: data.email ?? "",
        phone: data.phone ?? "",
        address: data.address ?? "",
        city: data.city ?? "",
        state: data.state ?? "",
        zipCode: data.zipCode ?? "",
        website: data.website ?? "",
        about: settings.about ?? "",
        whatsapp: settings.whatsapp ?? "",
        instagram: settings.social?.instagram ?? "",
        facebook: settings.social?.facebook ?? "",
        businessHours: settings.businessHours ?? "",
      });
    }
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const settingsPayload = JSON.stringify({
        about: values.about,
        whatsapp: values.whatsapp,
        social: { instagram: values.instagram, facebook: values.facebook },
        businessHours: values.businessHours,
      });
      return settingsService.update(
        {
          name: values.name,
          email: values.email,
          phone: values.phone,
          address: values.address,
          city: values.city,
          state: values.state,
          zipCode: values.zipCode,
          website: values.website,
          settings: settingsPayload,
        },
        companyId
      );
    },
    onSuccess: () => {
      toast.success("Configurações atualizadas com sucesso");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Configurações" description="Gerencie as informações da sua loja" />
        <div className="grid gap-4 lg:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Configurações" description="Gerencie as informações da sua loja e da vitrine pública" />

      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Dados da empresa</CardTitle>
              <CardDescription>Informações principais da sua loja</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" {...register("name")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" {...register("email")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" {...register("phone")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" {...register("website")} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Endereço</Label>
                <Input id="address" {...register("address")} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="city">Cidade</Label>
                  <Input id="city" {...register("city")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="state">Estado</Label>
                  <Input id="state" {...register("state")} maxLength={2} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="zipCode">CEP</Label>
                  <Input id="zipCode" {...register("zipCode")} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vitrine pública</CardTitle>
              <CardDescription>Informações exibidas na loja online</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="about">Sobre a loja</Label>
                <Textarea id="about" {...register("about")} rows={4} placeholder="Conte um pouco sobre sua loja..." />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="whatsapp">WhatsApp (com DDI)</Label>
                <Input id="whatsapp" {...register("whatsapp")} placeholder="5511999998888" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input id="instagram" {...register("instagram")} placeholder="@sualoja" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input id="facebook" {...register("facebook")} placeholder="sualoja" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="businessHours">Horário de funcionamento</Label>
                <Input id="businessHours" {...register("businessHours")} placeholder="Seg a Sex 9h–18h | Sáb 9h–13h" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={mutation.isPending}>
            <Save /> Salvar configurações
          </Button>
        </div>
      </form>
    </div>
  );
}
