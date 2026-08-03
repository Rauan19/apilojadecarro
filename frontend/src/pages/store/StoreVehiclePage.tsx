import * as React from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  DoorOpen,
  Fuel,
  Gauge,
  MessageCircle,
  Palette,
  Send,
} from "lucide-react";
import { publicService } from "@/services/public.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { fuelLabels, transmissionLabels } from "@/utils/labels";
import type { PublicStoreContext } from "@/layouts/PublicStoreLayout";

const leadSchema = z.object({
  name: z.string().min(2, "Informe seu nome"),
  phone: z.string().min(8, "Informe um telefone válido"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  notes: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

export function StoreVehiclePage() {
  const { id, slug } = useParams();
  const { token } = useOutletContext<PublicStoreContext>();
  const basePath = slug ? `/loja/${slug}` : "/loja";
  const [activeImage, setActiveImage] = React.useState(0);

  const { data: vehicle, isLoading } = useQuery({
    queryKey: ["public-vehicle", id],
    queryFn: () => publicService.getVehicleById(id as string, token),
    enabled: !!id && !!token,
  });

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: { name: "", phone: "", email: "", notes: "" },
  });

  const leadMutation = useMutation({
    mutationFn: (values: LeadFormValues) =>
      publicService.createLead(
        { name: values.name, phone: values.phone, email: values.email || undefined, notes: values.notes, vehicleId: id },
        token
      ),
    onSuccess: () => {
      toast.success("Recebemos seu interesse! Em breve entraremos em contato.");
      form.reset();
    },
    onError: () => toast.error("Não foi possível enviar seu contato. Tente novamente."),
  });

  const scheduleMutation = useMutation({
    mutationFn: (values: LeadFormValues) =>
      publicService.createSchedule(
        {
          name: values.name,
          phone: values.phone,
          email: values.email || undefined,
          notes: values.notes,
          vehicleId: id,
          date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        token
      ),
    onSuccess: () => {
      toast.success("Agendamento solicitado! Nossa equipe irá confirmar o melhor horário.");
      form.reset();
    },
    onError: () => toast.error("Não foi possível agendar. Tente novamente."),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          <div className="space-y-3">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <EmptyState icon={Car} title="Veículo não encontrado" description="Este veículo pode não estar mais disponível." />
      </div>
    );
  }

  const images = vehicle.images ?? [];
  const specs = [
    { icon: Gauge, label: "Quilometragem", value: `${formatNumber(vehicle.mileage)} km` },
    { icon: Fuel, label: "Combustível", value: fuelLabels[vehicle.fuel] },
    { icon: Car, label: "Câmbio", value: transmissionLabels[vehicle.transmission] },
    { icon: DoorOpen, label: "Portas", value: `${vehicle.doors}` },
    ...(vehicle.color ? [{ icon: Palette, label: "Cor", value: vehicle.color }] : []),
  ];

  const optionals = vehicle.optionals
    ? vehicle.optionals
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link to={basePath} className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar ao estoque
      </Link>

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-secondary">
            {images.length > 0 ? (
              <img src={images[activeImage]?.url} alt={vehicle.model} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Car className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveImage((i) => (i === 0 ? images.length - 1 : i - 1))}
                  className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 shadow-sm transition-colors hover:bg-background"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImage((i) => (i === images.length - 1 ? 0 : i + 1))}
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 shadow-sm transition-colors hover:bg-background"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={`h-16 w-20 shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                    index === activeImage ? "border-primary" : "border-transparent opacity-70"
                  }`}
                >
                  <img src={image.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <Badge variant="outline" className="mb-3">
            {vehicle.year}/{vehicle.yearModel}
          </Badge>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {vehicle.brand} {vehicle.model}
          </h1>
          {vehicle.version && <p className="mt-1 text-lg text-muted-foreground">{vehicle.version}</p>}
          <p className="font-display mt-4 text-4xl font-bold text-primary">{formatCurrency(vehicle.price)}</p>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {specs.map((spec) => (
              <div key={spec.label} className="rounded-lg border border-border p-3">
                <spec.icon className="mb-1.5 h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground">{spec.label}</p>
                <p className="text-sm font-semibold">{spec.value}</p>
              </div>
            ))}
          </div>

          {vehicle.description && (
            <div className="mt-6">
              <h3 className="mb-1.5 font-display text-sm font-semibold">Descrição</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{vehicle.description}</p>
            </div>
          )}

          {optionals.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 font-display text-sm font-semibold">Opcionais</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {optionals.map((item) => (
                  <span key={item} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-success" /> {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Separator className="my-10" />

      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" /> Tenho interesse neste veículo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" {...form.register("name")} />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Telefone / WhatsApp</Label>
                <Input id="phone" {...form.register("phone")} placeholder="(11) 99999-9999" />
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
              <Label htmlFor="notes">Mensagem (opcional)</Label>
              <Textarea id="notes" rows={3} {...form.register("notes")} placeholder="Tenho interesse, quero agendar uma visita..." />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                className="flex-1"
                loading={leadMutation.isPending}
                onClick={form.handleSubmit((values) => leadMutation.mutate(values))}
              >
                <Send /> Enviar interesse
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                loading={scheduleMutation.isPending}
                onClick={form.handleSubmit((values) => scheduleMutation.mutate(values))}
              >
                <Calendar /> Agendar visita
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
