import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImagePlus, Loader2, Plus, Upload, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { vehiclesService } from "@/services/vehicles.service";
import { getApiErrorMessage } from "@/services/api";
import { useCompany } from "@/hooks/useCompany";
import { fuelLabels, transmissionLabels, vehicleStatusLabels } from "@/utils/labels";
import { API_URL } from "@/services/api";
import { maskPlate, maskRenavam } from "@/lib/masks";
import { optionalPlateSchema, optionalRenavamSchema } from "@/lib/form-schemas";
import { MaskedInput } from "@/components/ui/masked-input";
import type { Vehicle } from "@/types";

const schema = z.object({
  brand: z.string().min(1, "Informe a marca"),
  model: z.string().min(1, "Informe o modelo"),
  version: z.string().optional(),
  year: z.coerce.number().int().min(1900, "Ano inválido"),
  yearModel: z.coerce.number().int().min(1900, "Ano inválido"),
  price: z.coerce.number().min(0, "Preço inválido"),
  mileage: z.coerce.number().int().min(0).optional(),
  plate: optionalPlateSchema,
  renavam: optionalRenavamSchema,
  fuel: z.enum(["FLEX", "GASOLINE", "ETHANOL", "DIESEL", "ELECTRIC", "HYBRID", "GNV"]),
  transmission: z.enum(["MANUAL", "AUTOMATIC", "CVT", "DCT"]),
  color: z.string().optional(),
  doors: z.coerce.number().int().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["AVAILABLE", "RESERVED", "SOLD", "MAINTENANCE"]),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface VehicleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle?: Vehicle | null;
}

function resolveImageUrl(url: string) {
  if (url.startsWith("http")) return url;
  const origin = API_URL.replace(/\/api\/?$/, "");
  return `${origin}/${url.replace(/^\//, "")}`;
}

export function VehicleFormDialog({ open, onOpenChange, vehicle }: VehicleFormDialogProps) {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const isEditing = !!vehicle;
  const [optionals, setOptionals] = React.useState<string[]>([]);
  const [optionalInput, setOptionalInput] = React.useState("");
  const [tab, setTab] = React.useState("dados");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fuel: "FLEX", transmission: "MANUAL", status: "AVAILABLE", doors: 4, mileage: 0 },
  });

  React.useEffect(() => {
    if (open) {
      setTab("dados");
      reset({
        brand: vehicle?.brand ?? "",
        model: vehicle?.model ?? "",
        version: vehicle?.version ?? "",
        year: vehicle?.year ?? new Date().getFullYear(),
        yearModel: vehicle?.yearModel ?? new Date().getFullYear(),
        price: vehicle?.price ?? 0,
        mileage: vehicle?.mileage ?? 0,
        plate: vehicle?.plate ? maskPlate(vehicle.plate) : "",
        renavam: vehicle?.renavam ? maskRenavam(vehicle.renavam) : "",
        fuel: vehicle?.fuel ?? "FLEX",
        transmission: vehicle?.transmission ?? "MANUAL",
        color: vehicle?.color ?? "",
        doors: vehicle?.doors ?? 4,
        description: vehicle?.description ?? "",
        status: vehicle?.status ?? "AVAILABLE",
        notes: vehicle?.notes ?? "",
      });
      try {
        setOptionals(vehicle?.optionals ? JSON.parse(vehicle.optionals) : []);
      } catch {
        setOptionals([]);
      }
    }
  }, [open, vehicle, reset]);

  const vehicleQuery = useQuery({
    queryKey: ["vehicle", vehicle?.id, companyId],
    queryFn: () => vehiclesService.getById(vehicle!.id, companyId),
    enabled: isEditing && open,
    initialData: vehicle ?? undefined,
  });

  const currentVehicle = vehicleQuery.data ?? vehicle;

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = { ...values, optionals };
      return isEditing
        ? vehiclesService.update(vehicle!.id, payload, companyId)
        : vehiclesService.create(payload, companyId);
    },
    onSuccess: () => {
      toast.success(isEditing ? "Veículo atualizado com sucesso" : "Veículo cadastrado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      onOpenChange(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => vehiclesService.addImages(vehicle!.id, files, companyId),
    onSuccess: () => {
      toast.success("Imagens adicionadas");
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["vehicle", vehicle?.id] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const removeImageMutation = useMutation({
    mutationFn: (imageId: string) => vehiclesService.removeImage(vehicle!.id, imageId, companyId),
    onSuccess: () => {
      toast.success("Imagem removida");
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["vehicle", vehicle?.id] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const addOptional = () => {
    const value = optionalInput.trim();
    if (value && !optionals.includes(value)) {
      setOptionals((prev) => [...prev, value]);
    }
    setOptionalInput("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar veículo" : "Novo veículo"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Atualize as informações do veículo." : "Preencha os dados para cadastrar um novo veículo."}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="dados">Dados do veículo</TabsTrigger>
            <TabsTrigger value="fotos" disabled={!isEditing}>
              Fotos {!isEditing && "(salve primeiro)"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados">
            <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="brand">Marca</Label>
                  <Input id="brand" {...register("brand")} placeholder="Toyota" />
                  {errors.brand && <p className="text-xs text-destructive">{errors.brand.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="model">Modelo</Label>
                  <Input id="model" {...register("model")} placeholder="Corolla" />
                  {errors.model && <p className="text-xs text-destructive">{errors.model.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="version">Versão</Label>
                  <Input id="version" {...register("version")} placeholder="XEi 2.0" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="year">Ano fabricação</Label>
                  <Input id="year" type="number" inputMode="numeric" {...register("year")} />
                  {errors.year && <p className="text-xs text-destructive">{errors.year.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="yearModel">Ano modelo</Label>
                  <Input id="yearModel" type="number" inputMode="numeric" {...register("yearModel")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="color">Cor</Label>
                  <Input id="color" {...register("color")} placeholder="Prata" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="price">Preço (R$)</Label>
                  <Input id="price" type="number" inputMode="decimal" step="0.01" {...register("price")} />
                  {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mileage">Quilometragem</Label>
                  <Input id="mileage" type="number" inputMode="numeric" {...register("mileage")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="doors">Portas</Label>
                  <Input id="doors" type="number" inputMode="numeric" {...register("doors")} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="plate">Placa</Label>
                  <MaskedInput
                    id="plate"
                    placeholder="ABC-1D23"
                    value={watch("plate") ?? ""}
                    mask={maskPlate}
                    onValueChange={(v) => setValue("plate", v, { shouldValidate: true })}
                  />
                  {errors.plate && <p className="text-xs text-destructive">{errors.plate.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="renavam">Renavam</Label>
                  <MaskedInput
                    id="renavam"
                    inputMode="numeric"
                    placeholder="12345678901"
                    value={watch("renavam") ?? ""}
                    mask={maskRenavam}
                    onValueChange={(v) => setValue("renavam", v, { shouldValidate: true })}
                  />
                  {errors.renavam && <p className="text-xs text-destructive">{errors.renavam.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={watch("status")} onValueChange={(v) => setValue("status", v as FormValues["status"])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(vehicleStatusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Combustível</Label>
                  <Select value={watch("fuel")} onValueChange={(v) => setValue("fuel", v as FormValues["fuel"])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(fuelLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Câmbio</Label>
                  <Select
                    value={watch("transmission")}
                    onValueChange={(v) => setValue("transmission", v as FormValues["transmission"])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(transmissionLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Opcionais</Label>
                <div className="flex gap-2">
                  <Input
                    value={optionalInput}
                    onChange={(e) => setOptionalInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addOptional();
                      }
                    }}
                    placeholder="Ex: Ar condicionado (Enter para adicionar)"
                  />
                  <Button type="button" variant="outline" onClick={addOptional}>
                    <Plus />
                  </Button>
                </div>
                {optionals.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {optionals.map((item) => (
                      <Badge key={item} variant="secondary" className="gap-1 pr-1">
                        {item}
                        <button
                          type="button"
                          onClick={() => setOptionals((prev) => prev.filter((o) => o !== item))}
                          className="rounded-full p-0.5 hover:bg-background/60"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" {...register("description")} placeholder="Detalhes sobre o veículo..." rows={3} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Observações internas</Label>
                <Textarea id="notes" {...register("notes")} placeholder="Observações visíveis apenas para a equipe" rows={2} />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" loading={mutation.isPending}>
                  {isEditing ? "Salvar alterações" : "Cadastrar veículo"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="fotos" className="space-y-4">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {currentVehicle?.images.map((image) => (
                <div key={image.id} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                  <img src={resolveImageUrl(image.url)} alt="Foto do veículo" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImageMutation.mutate(image.id)}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Remover imagem"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadMutation.isPending}
                className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {uploadMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                <span className="text-xs font-medium">Adicionar</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                if (files.length > 0) uploadMutation.mutate(files);
                e.target.value = "";
              }}
            />

            {(!currentVehicle?.images || currentVehicle.images.length === 0) && (
              <p className="flex items-center gap-2 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                <Upload className="h-4 w-4" /> Nenhuma imagem cadastrada. Clique em "Adicionar" para enviar fotos.
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
