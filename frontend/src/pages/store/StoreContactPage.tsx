import { useOutletContext } from "react-router-dom";
import type { ComponentType } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { publicService } from "@/services/public.service";
import {
  StoreClockIcon,
  StoreMailIcon,
  StorePhoneIcon,
  StorePinIcon,
  StoreWhatsAppIcon,
} from "@/components/store/StoreIcons";
import { FacebookIcon, InstagramIcon, TikTokIcon, YoutubeIcon } from "@/components/store/SocialIcons";
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
  const { company, slug } = useOutletContext<PublicStoreContext>();
  const settings = (company?.settings ?? {}) as Record<string, any>;
  const whatsapp: string | undefined = settings.whatsapp
    ? String(settings.whatsapp).replace(/\D/g, "")
    : undefined;

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", phone: "", email: "", notes: "" },
  });

  const sendToWhatsApp = (values: ContactFormValues) => {
    if (!whatsapp) {
      toast.error("Esta loja ainda não configurou o WhatsApp.");
      return;
    }

    const lines = [
      "Olá! Vim pelo site da loja.",
      "",
      `Nome: ${values.name}`,
      `Telefone: ${values.phone}`,
      values.email ? `E-mail: ${values.email}` : null,
      `Mensagem: ${values.notes}`,
    ].filter(Boolean);

    publicService
      .createLeadBySlug(slug, {
        name: values.name,
        phone: values.phone,
        email: values.email || undefined,
        notes: values.notes,
      })
      .catch(() => undefined);

    window.open(
      `https://wa.me/${whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`,
      "_blank",
      "noopener,noreferrer"
    );
    toast.success("Abrindo WhatsApp com sua mensagem...");
    form.reset();
  };

  const infoItems = [
    company?.phone && {
      icon: StorePhoneIcon,
      label: "Telefone",
      value: company.phone,
      href: `tel:${company.phone}`,
    },
    company?.email && {
      icon: StoreMailIcon,
      label: "E-mail",
      value: company.email,
      href: `mailto:${company.email}`,
    },
    company?.city && {
      icon: StorePinIcon,
      label: "Localização",
      value: company.city,
    },
    settings.whatsapp && {
      icon: StoreWhatsAppIcon,
      label: "WhatsApp",
      value: settings.whatsapp,
      href: `https://wa.me/${String(settings.whatsapp).replace(/\D/g, "")}`,
    },
    settings.businessHours && {
      icon: StoreClockIcon,
      label: "Funcionamento",
      value: settings.businessHours,
    },
    settings.social?.instagram && {
      icon: InstagramIcon,
      label: "Instagram",
      value: settings.social.instagram,
      href: `https://instagram.com/${String(settings.social.instagram).replace("@", "")}`,
    },
    settings.social?.facebook && {
      icon: FacebookIcon,
      label: "Facebook",
      value: settings.social.facebook,
      href: String(settings.social.facebook).startsWith("http")
        ? String(settings.social.facebook)
        : `https://facebook.com/${String(settings.social.facebook).replace("@", "")}`,
    },
    settings.social?.youtube && {
      icon: YoutubeIcon,
      label: "YouTube",
      value: settings.social.youtube,
      href: String(settings.social.youtube).startsWith("http")
        ? String(settings.social.youtube)
        : `https://youtube.com/@${String(settings.social.youtube).replace("@", "")}`,
    },
    settings.social?.tiktok && {
      icon: TikTokIcon,
      label: "TikTok",
      value: settings.social.tiktok,
      href: String(settings.social.tiktok).startsWith("http")
        ? String(settings.social.tiktok)
        : `https://tiktok.com/@${String(settings.social.tiktok).replace("@", "")}`,
    },
  ].filter(Boolean) as {
    icon: ComponentType<{ className?: string }>;
    label: string;
    value: string;
    href?: string;
  }[];

  return (
    <div>
      <section className="border-b border-[#e6e6e6] bg-[#2e2e2e] text-white">
        <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-7">
          <h1 className="font-display text-xl font-bold tracking-tight sm:text-3xl">Fale com a loja</h1>
          <p className="mt-1 max-w-xl text-sm leading-snug text-white/75 sm:text-base">
            Tire dúvidas, peça uma proposta ou agende uma visita ao estoque.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-10">
        <div className="grid gap-5 lg:grid-cols-5 lg:gap-6">
          <div className="order-2 space-y-3 lg:order-1 lg:col-span-2">
            {infoItems.map((item) => {
              const Content = (
                <div className="flex items-start gap-3 rounded-lg border border-[#e6e6e6] bg-white p-4 transition-colors hover:border-[#c8c8c8]">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#f5f5f5] text-[#2e2e2e]">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">{item.value}</p>
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

          <div className="order-1 rounded-lg border border-border bg-white p-4 shadow-[0_8px_24px_-14px_rgb(15_23_42/0.25)] sm:p-6 lg:order-2 lg:col-span-3">
            <h2 className="font-display text-lg font-bold">Envie uma mensagem</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Preencha e envie: abrimos o WhatsApp da loja com seus dados.
            </p>
            <form onSubmit={form.handleSubmit(sendToWhatsApp)} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" {...form.register("name")} className="h-11 bg-white text-base sm:text-sm" autoComplete="name" />
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
                    className="h-11 bg-white text-base sm:text-sm"
                    autoComplete="tel"
                  />
                  {form.formState.errors.phone && (
                    <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail (opcional)</Label>
                <Input id="email" type="email" {...form.register("email")} className="h-11 bg-white text-base sm:text-sm" autoComplete="email" />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">Mensagem</Label>
                <Textarea id="notes" rows={5} {...form.register("notes")} placeholder="Como podemos ajudar?" className="bg-white text-base sm:text-sm" />
                {form.formState.errors.notes && (
                  <p className="text-xs text-destructive">{form.formState.errors.notes.message}</p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full font-bold bg-[#25D366] text-white hover:bg-[#1ebe57] sm:w-auto"
                disabled={!whatsapp}
              >
                <StoreWhatsAppIcon className="h-4 w-4" />
                Enviar no WhatsApp
              </Button>
              {!whatsapp && (
                <p className="text-xs text-muted-foreground">
                  WhatsApp da loja não configurado. Use o telefone ou e-mail ao lado.
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
