import * as React from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { usersService } from "@/services/users.service";
import { getApiErrorMessage } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { getInitials } from "@/lib/utils";
import { roleLabels } from "@/utils/labels";

interface FormValues {
  name: string;
  phone: string;
  password: string;
}

export function ProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canSelfUpdate = user?.role === "SUPER_ADMIN" || user?.role === "STORE_ADMIN";

  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { name: user?.name ?? "", phone: "", password: "" },
  });

  React.useEffect(() => {
    if (user) reset({ name: user.name, phone: "", password: "" });
  }, [user, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      usersService.update(user!.id, {
        name: values.name,
        phone: values.phone || undefined,
        password: values.password || undefined,
      }),
    onSuccess: () => {
      toast.success("Perfil atualizado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["auth-me"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  if (!user) return null;

  return (
    <div>
      <PageHeader title="Meu perfil" description="Gerencie suas informações pessoais" />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-xl">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-display text-lg font-semibold">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Badge variant="outline" className="gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> {roleLabels[user.role]}
            </Badge>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informações pessoais</CardTitle>
            <CardDescription>
              {canSelfUpdate
                ? "Atualize seu nome, telefone ou senha de acesso"
                : "Entre em contato com o administrador da sua loja para alterar seus dados"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" disabled={!canSelfUpdate} {...register("name")} />
              </div>

              <div className="space-y-1.5">
                <Label>E-mail</Label>
                <Input value={user.email} disabled />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" disabled={!canSelfUpdate} {...register("phone")} placeholder="(11) 99999-9999" />
              </div>

              <Separator />

              <div className="space-y-1.5">
                <Label htmlFor="password">Nova senha (opcional)</Label>
                <Input
                  id="password"
                  type="password"
                  disabled={!canSelfUpdate}
                  {...register("password")}
                  placeholder="Deixe em branco para manter a atual"
                />
              </div>

              {canSelfUpdate && (
                <div className="flex justify-end">
                  <Button type="submit" loading={mutation.isPending}>
                    <Save /> Salvar alterações
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
