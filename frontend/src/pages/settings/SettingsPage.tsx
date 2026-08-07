import * as React from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bot,
  Check,
  Copy,
  CreditCard,
  ExternalLink,
  Globe,
  ImagePlus,
  Loader2,
  Palette,
  Save,
  Share2,
  Smartphone,
  Store,
  Trash2,
  Upload,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/ui/masked-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardSkeleton } from "@/components/shared/LoadingPage";
import { settingsService } from "@/services/settings.service";
import { uploadsService } from "@/services/uploads.service";
import { whatsappService } from "@/services/whatsapp.service";
import { getApiErrorMessage } from "@/services/api";
import { useCompany } from "@/hooks/useCompany";
import { buildBrandThemeStyle, normalizeHexColor } from "@/utils/color";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { MAX_STORE_BANNERS, parseStoreBanners, type StoreBanner } from "@/utils/storeBanners";
import { isValidCnpj, isValidCpf, maskDocument, onlyDigits } from "@/lib/masks";
import { SubscriptionTab } from "./SubscriptionTab";

interface FormValues {
  name: string;
  document: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  website: string;
  customDomain: string;
  primaryColor: string;
  about: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
  youtube: string;
  tiktok: string;
  businessHours: string;
  businessHoursStart: string;
  businessHoursEnd: string;
}

function getStorePublicUrl(slug: string, customDomain?: string | null) {
  if (customDomain?.trim()) {
    const host = customDomain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    return `https://${host}`;
  }
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/loja/${slug}`;
}

export function SettingsPage() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const bannerFileRef = React.useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [logoPath, setLogoPath] = React.useState<string | null>(null);
  const [banners, setBanners] = React.useState<StoreBanner[]>([]);
  const [copied, setCopied] = React.useState(false);
  const [tab, setTab] = React.useState("empresa");

  const { data, isLoading } = useQuery({
    queryKey: ["settings", companyId],
    queryFn: () => settingsService.get(companyId),
  });

  const { data: whatsappStatus } = useQuery({
    queryKey: ["whatsapp-status", companyId],
    queryFn: () => whatsappService.getStatus(companyId),
    enabled: tab === "whatsapp",
    refetchInterval: (query) => (query.state.data?.connected ? false : 3000),
  });

  const whatsappConnectMutation = useMutation({
    mutationFn: () => whatsappService.connect(companyId),
    onSuccess: (result) => {
      queryClient.setQueryData(["whatsapp-status", companyId], result);
      if (!result.qrcode) {
        toast.error("Não recebi o QR Code da Evolution API. Tente novamente.");
      }
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const whatsappDisconnectMutation = useMutation({
    mutationFn: () => whatsappService.disconnect(companyId),
    onSuccess: (result) => {
      queryClient.setQueryData(["whatsapp-status", companyId], result);
      toast.success("WhatsApp desconectado");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const whatsappBotToggleMutation = useMutation({
    mutationFn: (enabled: boolean) => whatsappService.setBotEnabled(enabled, companyId),
    onSuccess: (result) => {
      queryClient.setQueryData(["whatsapp-status", companyId], result);
      toast.success(result.botEnabled ? "Bot ativado" : "Bot desativado");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const { register, handleSubmit, reset, watch, setValue } = useForm<FormValues>({
    defaultValues: { primaryColor: "#e10600" },
  });

  const primaryColor = watch("primaryColor");
  const customDomain = watch("customDomain");
  const documentValue = watch("document");
  const brandPreview = buildBrandThemeStyle(primaryColor);

  // Avisa enquanto digita, mas só depois que o número tem tamanho de CPF/CNPJ.
  const documentDigits = onlyDigits(documentValue ?? "");
  const documentInvalid =
    (documentDigits.length === 11 && !isValidCpf(documentDigits)) ||
    (documentDigits.length === 14 && !isValidCnpj(documentDigits));

  React.useEffect(() => {
    if (data) {
      const settings = (data.settings ?? {}) as Record<string, any>;
      const theme = settings.theme ?? {};
      reset({
        name: data.name ?? "",
        document: data.document ?? "",
        email: data.email ?? "",
        phone: data.phone ?? "",
        address: data.address ?? "",
        city: data.city ?? "",
        state: data.state ?? "",
        zipCode: data.zipCode ?? "",
        website: data.website ?? "",
        customDomain: data.customDomain ?? "",
        primaryColor: normalizeHexColor(theme.primaryColor) ?? "#e10600",
        about: settings.about ?? "",
        whatsapp: settings.whatsapp ?? "",
        instagram: settings.social?.instagram ?? "",
        facebook: settings.social?.facebook ?? "",
        youtube: settings.social?.youtube ?? "",
        tiktok: settings.social?.tiktok ?? "",
        businessHours: settings.businessHours ?? "",
        businessHoursStart: settings.businessHoursStart ?? "08:00",
        businessHoursEnd: settings.businessHoursEnd ?? "18:00",
      });
      setLogoPreview(resolveMediaUrl(data.logo) ?? data.logo);
      setLogoPath(data.logo);
      setBanners(parseStoreBanners(settings.banners));
    }
  }, [data, reset]);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadsService.uploadImage(file, companyId),
    onSuccess: async (result) => {
      const logoUrl = result.url;
      setLogoPreview(resolveMediaUrl(logoUrl) ?? logoUrl);
      setLogoPath(logoUrl);
      try {
        await settingsService.update({ logo: logoUrl }, companyId);
        queryClient.invalidateQueries({ queryKey: ["settings"] });
        queryClient.invalidateQueries({ queryKey: ["public-company"] });
        toast.success("Logo atualizada. Já aparece no topo do painel e na vitrine.");
      } catch (error) {
        toast.success("Logo enviada. Clique em Salvar para confirmar.");
        toast.error(getApiErrorMessage(error));
      }
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const bannerUploadMutation = useMutation({
    mutationFn: (file: File) => uploadsService.uploadImage(file, companyId),
    onSuccess: (result) => {
      setBanners((prev) => {
        if (prev.length >= MAX_STORE_BANNERS) {
          toast.error(`Máximo de ${MAX_STORE_BANNERS} banners`);
          return prev;
        }
        return [
          ...prev,
          {
            id: crypto.randomUUID(),
            imageUrl: result.url,
            title: "",
            subtitle: "",
            linkUrl: "",
          },
        ];
      });
      toast.success("Banner adicionado. Ajuste o texto e clique em Salvar.");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const settingsPayload = JSON.stringify({
        about: values.about,
        whatsapp: values.whatsapp,
        social: {
          instagram: values.instagram,
          facebook: values.facebook,
          youtube: values.youtube,
          tiktok: values.tiktok,
        },
        businessHours: values.businessHours,
        businessHoursStart: values.businessHoursStart,
        businessHoursEnd: values.businessHoursEnd,
        theme: {
          primaryColor: normalizeHexColor(values.primaryColor) || "#e10600",
        },
        banners: banners.map((b, index) => ({
          id: b.id,
          imageUrl: b.imageUrl,
          title: b.title?.trim() || undefined,
          subtitle: b.subtitle?.trim() || undefined,
          linkUrl: b.linkUrl?.trim() || undefined,
          order: index,
        })),
      });
      return settingsService.update(
        {
          name: values.name,
          document: values.document.trim(),
          email: values.email,
          phone: values.phone,
          address: values.address,
          city: values.city,
          state: values.state,
          zipCode: values.zipCode,
          website: values.website,
          customDomain: values.customDomain.trim() || null,
          logo: logoPath ?? undefined,
          settings: settingsPayload,
        },
        companyId
      );
    },
    onSuccess: () => {
      toast.success("Configurações salvas. A cor vale na vitrine e no seu painel.");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["public-company"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const copyStoreLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link da loja copiado!");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar o link");
    }
  };

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

  const slug = data?.slug;
  const storePath = slug ? `/loja/${slug}` : null;
  const publicUrl = slug ? getStorePublicUrl(slug, customDomain || data?.customDomain) : null;
  const hasCustomDomain = !!(customDomain || data?.customDomain)?.trim();

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Configurações"
        description="Organize a loja por seções: dados, visual, vitrine e divulgação"
      />

      {/* Link para divulgar: sempre no topo */}
      {publicUrl && storePath && (
        <Card className="border-primary/25 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Share2 className="h-4 w-4 text-primary" />
              Link da sua loja
            </CardTitle>
            <CardDescription>
              {hasCustomDomain
                ? "Você já tem domínio próprio. Use este endereço para divulgar."
                : "Ainda sem domínio próprio? Copie este link e envie no WhatsApp, Instagram ou anúncios."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input readOnly value={publicUrl} className="font-mono text-sm bg-white" />
              <div className="flex w-full shrink-0 gap-2 sm:w-auto">
                <Button type="button" className="flex-1 sm:flex-none" onClick={() => copyStoreLink(publicUrl)}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copiado" : "Copiar link"}
                </Button>
                <Button type="button" variant="outline" className="flex-1 sm:flex-none" asChild>
                  <Link to={storePath} target="_blank">
                    <ExternalLink className="h-4 w-4" />
                    Abrir
                  </Link>
                </Button>
              </div>
            </div>
            {!hasCustomDomain && (
              <p className="text-xs text-muted-foreground">
                Caminho curto: <span className="font-mono font-medium text-foreground">{storePath}</span>
                {" · "}
                Domínio próprio fica na aba <button type="button" className="font-semibold text-primary underline-offset-2 hover:underline" onClick={() => setTab("dominio")}>Domínio</button>.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <div className="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:overflow-visible sm:px-0">
            <TabsList className="inline-flex h-auto min-w-full w-max justify-start gap-1 bg-secondary/60 p-1 sm:flex sm:w-full sm:flex-wrap">
              <TabsTrigger value="empresa" className="shrink-0 gap-1.5">
                <Store className="h-3.5 w-3.5" /> Empresa
              </TabsTrigger>
              <TabsTrigger value="identidade" className="shrink-0 gap-1.5">
                <Palette className="h-3.5 w-3.5" /> Identidade
              </TabsTrigger>
              <TabsTrigger value="vitrine" className="shrink-0 gap-1.5">
                <Share2 className="h-3.5 w-3.5" /> Vitrine e redes
              </TabsTrigger>
              <TabsTrigger value="banners" className="shrink-0 gap-1.5">
                <Upload className="h-3.5 w-3.5" /> Banners
              </TabsTrigger>
              <TabsTrigger value="dominio" className="shrink-0 gap-1.5">
                <Globe className="h-3.5 w-3.5" /> Domínio
              </TabsTrigger>
              <TabsTrigger value="assinatura" className="shrink-0 gap-1.5">
                <CreditCard className="h-3.5 w-3.5" /> Assinatura
              </TabsTrigger>
              <TabsTrigger
                value="whatsapp"
                className="shrink-0 gap-1.5 bg-[#25D366] text-white hover:bg-[#1fb958] hover:text-white data-[state=active]:bg-[#1fb958] data-[state=active]:text-white"
              >
                <Smartphone className="h-3.5 w-3.5" /> Conectar WhatsApp Bot Atendimento
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="empresa" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Dados da empresa</CardTitle>
                <CardDescription>Informações cadastrais da loja</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" {...register("name")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="document">CPF ou CNPJ</Label>
                  <MaskedInput
                    id="document"
                    inputMode="numeric"
                    placeholder="00.000.000/0000-00"
                    value={documentValue ?? ""}
                    mask={maskDocument}
                    onValueChange={(value) =>
                      setValue("document", value, { shouldDirty: true })
                    }
                  />
                  <p
                    className={`text-xs ${documentInvalid ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    {documentInvalid
                      ? "Documento inválido — confira os números."
                      : "Necessário para assinar um plano e emitir o PIX."}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" {...register("email")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" {...register("phone")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" {...register("website")} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input id="address" {...register("address")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city">Cidade</Label>
                  <Input id="city" {...register("city")} />
                </div>
                <div className="grid grid-cols-2 gap-4">
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
          </TabsContent>

          <TabsContent value="identidade" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Identidade visual</CardTitle>
                <CardDescription>Logo e cor da marca na vitrine pública</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Logo da loja</Label>
                  <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                    <div className="flex h-28 w-44 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-secondary/30">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="max-h-full max-w-full object-contain p-2" />
                      ) : (
                        <ImagePlus className="h-8 w-8 text-muted-foreground/50" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadMutation.mutate(file);
                          e.target.value = "";
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        disabled={uploadMutation.isPending}
                        onClick={() => fileRef.current?.click()}
                      >
                        {uploadMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ImagePlus className="h-4 w-4" />
                        )}
                        Enviar logo
                      </Button>
                      <p className="text-xs text-muted-foreground">PNG ou JPG, até 5 MB. Aparece grande no topo da vitrine.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="primaryColor">Cor dos botões</Label>
                  <p className="text-xs text-muted-foreground">
                    No estilo WebMotors: preço e textos ficam pretos. A cor da loja entra só em botões e destaques.
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      id="primaryColor"
                      type="color"
                      className="h-11 w-14 cursor-pointer rounded border border-border bg-white p-1"
                      value={normalizeHexColor(primaryColor) ?? "#e10600"}
                      onChange={(e) =>
                        setValue("primaryColor", e.target.value, { shouldDirty: true, shouldValidate: true })
                      }
                    />
                    <Input
                      value={primaryColor ?? ""}
                      onChange={(e) => setValue("primaryColor", e.target.value, { shouldDirty: true })}
                      placeholder="#e10600"
                      className="max-w-[10rem] font-mono"
                    />
                  </div>
                  <div className="mt-3 space-y-3 rounded-lg border border-border p-3" style={brandPreview}>
                    <p className="text-xs text-muted-foreground">Prévia:</p>
                    <div className="rounded-md border border-[#e6e6e6] bg-white p-3">
                      <p className="text-xs font-bold uppercase text-[#2e2e2e]">JEEP COMPASS</p>
                      <p className="text-[11px] text-[#696969]">2.0 Longitude</p>
                      <p className="mt-1 text-[11px] text-[#696969] line-through">R$ 149.900</p>
                      <p className="text-lg font-bold text-[#2e2e2e]">R$ 132.900</p>
                      <p className="text-[11px] font-bold text-[#e81123]">-11%</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" className="pointer-events-none font-bold">
                        Buscar
                      </Button>
                      <Button type="button" className="pointer-events-none font-bold bg-[#25D366] text-white hover:bg-[#25D366]">
                        WhatsApp
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vitrine" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Vitrine e redes sociais</CardTitle>
                <CardDescription>Textos, WhatsApp e redes do footer da loja</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="about">Sobre a loja</Label>
                  <Textarea id="about" {...register("about")} rows={4} placeholder="Conte um pouco sobre sua loja..." />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="whatsapp">WhatsApp (com DDI)</Label>
                  <Input id="whatsapp" {...register("whatsapp")} placeholder="5511999998888" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="businessHours">Horário de funcionamento (texto)</Label>
                  <Input id="businessHours" {...register("businessHours")} placeholder="Seg a Sex 9h–18h | Sáb 9h–13h" />
                  <p className="text-xs text-muted-foreground">Aparece na vitrine pro cliente ler.</p>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Horário de atendimento do bot de WhatsApp *</Label>
                  <p className="text-xs text-muted-foreground">
                    Obrigatório: usado pelo bot pra saber quando avisar o cliente que a loja está fechada.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="businessHoursStart" className="text-xs font-normal text-muted-foreground">
                        Abre às
                      </Label>
                      <Input
                        id="businessHoursStart"
                        type="time"
                        required
                        {...register("businessHoursStart", { required: true })}
                        className="w-32"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="businessHoursEnd" className="text-xs font-normal text-muted-foreground">
                        Fecha às
                      </Label>
                      <Input
                        id="businessHoursEnd"
                        type="time"
                        required
                        {...register("businessHoursEnd", { required: true })}
                        className="w-32"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input id="instagram" {...register("instagram")} placeholder="@sualoja" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input id="facebook" {...register("facebook")} placeholder="sualoja" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="youtube">YouTube</Label>
                  <Input id="youtube" {...register("youtube")} placeholder="@sualoja ou URL" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tiktok">TikTok</Label>
                  <Input id="tiktok" {...register("tiktok")} placeholder="@sualoja" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="banners" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Banners da página inicial</CardTitle>
                <CardDescription>
                  Carrossel no topo da vitrine (até {MAX_STORE_BANNERS} imagens)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
                  <p className="font-semibold">Tamanho e proporção recomendados</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
                    <li>
                      Proporção ideal: <span className="font-medium text-foreground">5:1</span> (bem larga e baixa)
                    </li>
                    <li>
                      Resolução sugerida: <span className="font-medium text-foreground">1920 × 384 px</span>
                    </li>
                    <li>
                      Também funciona bem: <span className="font-medium text-foreground">1600 × 320 px</span>
                    </li>
                    <li>Evite imagens altas (quadradas ou 16:9 cheias); o banner na vitrine é baixo</li>
                    <li>Formatos: JPG, PNG ou WebP. Deixe o assunto principal no centro da imagem</li>
                  </ul>
                </div>

                <input
                  ref={bannerFileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) bannerUploadMutation.mutate(file);
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={bannerUploadMutation.isPending || banners.length >= MAX_STORE_BANNERS}
                  onClick={() => bannerFileRef.current?.click()}
                >
                  {bannerUploadMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Adicionar banner ({banners.length}/{MAX_STORE_BANNERS})
                </Button>

                {banners.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                    Sem banners ainda. Sem eles, a vitrine mostra o título padrão com a cor da loja.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {banners.map((banner, index) => (
                      <div
                        key={banner.id}
                        className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[160px_1fr_auto]"
                      >
                        <div className="aspect-[5/1] overflow-hidden rounded-md bg-secondary">
                          <img src={resolveMediaUrl(banner.imageUrl)} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div className="space-y-2">
                          <Input
                            placeholder="Título do banner"
                            value={banner.title ?? ""}
                            onChange={(e) =>
                              setBanners((prev) =>
                                prev.map((b, i) => (i === index ? { ...b, title: e.target.value } : b))
                              )
                            }
                          />
                          <Input
                            placeholder="Subtítulo (opcional)"
                            value={banner.subtitle ?? ""}
                            onChange={(e) =>
                              setBanners((prev) =>
                                prev.map((b, i) => (i === index ? { ...b, subtitle: e.target.value } : b))
                              )
                            }
                          />
                          <Input
                            placeholder="Link ao clicar (opcional)"
                            value={banner.linkUrl ?? ""}
                            onChange={(e) =>
                              setBanners((prev) =>
                                prev.map((b, i) => (i === index ? { ...b, linkUrl: e.target.value } : b))
                              )
                            }
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 w-10 shrink-0 p-0 text-destructive"
                          onClick={() => setBanners((prev) => prev.filter((_, i) => i !== index))}
                          aria-label="Remover banner"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dominio" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Domínio próprio</CardTitle>
                <CardDescription>
                  Opcional. Enquanto não tiver, use o link da loja no topo da página para divulgar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="customDomain">Domínio (sem http)</Label>
                  <Input id="customDomain" {...register("customDomain")} placeholder="www.minhaloja.com.br" />
                  <p className="text-xs text-muted-foreground">
                    Depois de configurar o DNS apontando para o frontend, a vitrine abre direto neste domínio.
                  </p>
                </div>
                {storePath && (
                  <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-4 text-sm">
                    <p className="font-medium">Link atual (sem domínio próprio)</p>
                    <p className="mt-1 font-mono text-muted-foreground">{publicUrl}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assinatura" className="mt-0">
            <SubscriptionTab companyId={companyId} />
          </TabsContent>

          <TabsContent value="whatsapp" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Bot de WhatsApp</CardTitle>
                <CardDescription>
                  Conecte o número da loja e deixe o bot responder clientes com o estoque de veículos, fotos e captura de leads.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    Status da conexão
                  </div>
                  <Badge
                    variant={
                      whatsappStatus?.connected
                        ? "success"
                        : whatsappStatus?.status === "connecting"
                          ? "warning"
                          : "secondary"
                    }
                  >
                    {whatsappStatus?.connected
                      ? "Conectado"
                      : whatsappStatus?.status === "connecting"
                        ? "Conectando"
                        : "Desconectado"}
                  </Badge>
                </div>

                {!whatsappStatus?.connected && whatsappStatus?.qrcode && (
                  <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-4">
                    <img
                      src={
                        whatsappStatus.qrcode.startsWith("data:")
                          ? whatsappStatus.qrcode
                          : `data:image/png;base64,${whatsappStatus.qrcode}`
                      }
                      alt="QR Code do WhatsApp"
                      className="h-56 w-56 rounded-md border border-border"
                    />
                    <p className="text-center text-xs text-muted-foreground">
                      Abra o WhatsApp no celular da loja → Aparelhos conectados → Conectar aparelho, e escaneie o código.
                    </p>
                  </div>
                )}

                {whatsappStatus?.connected && (
                  <>
                    <div className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Bot className="h-4 w-4 text-muted-foreground" />
                        Bot de veículos ativo
                      </div>
                      <Switch
                        checked={whatsappStatus.botEnabled}
                        disabled={whatsappBotToggleMutation.isPending}
                        onCheckedChange={(checked) => whatsappBotToggleMutation.mutate(checked)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Com o bot ativo, quem mandar mensagem recebe um menu para ver o estoque, buscar por marca e falar com um vendedor — com fotos dos veículos e criação automática de lead.
                    </p>
                  </>
                )}

                <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                  {whatsappStatus?.connected ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="text-destructive"
                      loading={whatsappDisconnectMutation.isPending}
                      onClick={() => whatsappDisconnectMutation.mutate()}
                    >
                      Desconectar
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      loading={whatsappConnectMutation.isPending}
                      onClick={() => whatsappConnectMutation.mutate()}
                    >
                      {whatsappStatus?.qrcode ? "Gerar novo QR Code" : "Conectar"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* A aba Assinatura não edita configurações — salvar ali não faz sentido. */}
        {tab !== "assinatura" && (
          <div className="sticky bottom-0 z-10 mt-6 flex justify-end border-t border-border bg-background/95 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <Button type="submit" className="h-11 w-full font-bold sm:w-auto" loading={mutation.isPending}>
              <Save /> Salvar configurações
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
