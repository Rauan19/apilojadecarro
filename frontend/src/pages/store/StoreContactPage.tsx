import { useOutletContext } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Clock, Mail, MapPin, MessageCircle, Phone, Send, Share2 } from "lucide-react";
import { publicService } from "@/services/public.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MaskedInput } from "@/components/ui/masked-input";
import { maskPhone } from "@/lib/masks";
import { optionalEmailSchema, requiredPhoneSchema } from "@/lib/form-schemas";
import type { PublicStoreContext } from "@/layouts/PublicStoreLayout";

const contactSchema = z.object({
  name: z.string().min(2, "Informe seu nome"),
  phone: requiredPhoneSchema,
  email: optionalEmailSchema,
  notes: z.string().min(5, "Escreva uma mensagem"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export function StoreContactPage() {
  const { company, token } = useOutletContext<PublicStoreContext>();
  const settings = (company?.settings ?? {}) as Record<string, any>;

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", phone: "", email: "", notes: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: ContactFormValues) =>
      publicService.createLead({ name: values.name, phone: values.phone, email: values.email || undefined, notes: values.notes }, token),
    onSuccess: () => {
      toast.success("Mensagem enviada! Em breve entraremos em contato.");
      form.reset();
    },
    onError: () => toast.error("Não foi possível enviar sua mensagem. Tente novamente."),
  });

  const infoItems = [
    company?.phone && { icon: Phone, label: "Telefone", value: company.phone, href: `tel:${company.phone}` },
    company?.email && { icon: Mail, label: "E-mail", value: company.email, href: `mailto:${company.email}` },
    company?.city && { icon: MapPin, label: "Localização", value: company.city },
    settings.whatsapp && {
      icon: MessageCircle,
      label: "WhatsApp",
      value: settings.whatsapp,
      href: `https://wa.me/${settings.whatsapp}`,
    },
    settings.businessHours && { icon: Clock, label: "Funcionamento", value: settings.businessHours },
    settings.social?.instagram && {
      icon: Share2,
      label: "Instagram",
      value: settings.social.instagram,
      href: `https://instagram.com/${String(settings.social.instagram).replace("@", "")}`,
    },
  ].filter(Boolean) as { icon: any; label: string; value: string; href?: string }[];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mb-10 text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight">Fale conosco</h1>
        <p className="mt-2 text-muted-foreground">
          Tire suas dúvidas, agende uma visita ou solicite mais informações sobre nossos veículos.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          {infoItems.map((item) => {
            const Content = (
              <div className="flex items-start gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-secondary/50">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <item.icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-medium">{item.value}</p>
                </div>
              </div>
            );
            return item.href ? (
              <a key={item.label} href={item.href} target="_blank" rel="noreferrer">
                {Content}
              </a>
            ) : (
              <div key={item.label}>{Content}</div>
            );
          })}
        </div>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Envie uma mensagem</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" {...form.register("name")} />
                  {form.formState.errors.name && (
                    <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Telefone</Label>
                  <MaskedInput
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    placeholder="(11) 99999-9999"
                    value={form.watch("phone") ?? ""}
                    mask={maskPhone}
                    onValueChange={(v) => form.setValue("phone", v, { shouldValidate: true })}
                  />
                  {form.formState.errors.phone && (
                    <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail (opcional)</Label>
                <Input id="email" type="email" {...form.register("email")} />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">Mensagem</Label>
                <Textarea id="notes" rows={5} {...form.register("notes")} placeholder="Como podemos ajudar?" />
                {form.formState.errors.notes && (
                  <p className="text-xs text-destructive">{form.formState.errors.notes.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full sm:w-auto" loading={mutation.isPending}>
                <Send /> Enviar mensagem
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
