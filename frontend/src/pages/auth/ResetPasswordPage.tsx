import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/auth.service";
import { getApiErrorMessage } from "@/services/api";

const schema = z
  .object({
    newPassword: z.string().min(6, "Mínimo de 6 caracteres"),
    confirmPassword: z.string().min(6, "Confirme a senha"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = React.useState(false);

  const { data: validation, isLoading } = useQuery({
    queryKey: ["password-reset-validate", token],
    queryFn: () => authService.validatePasswordReset(token),
    enabled: !!token,
    retry: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await authService.confirmPasswordReset(token, values.newPassword);
      toast.success("Senha alterada. Faça login com a nova senha.");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        <BrandLogo subtitle="Redefinir senha" />

        {!token ? (
          <p className="text-sm text-muted-foreground">
            Link inválido. Solicite um novo link ao administrador da plataforma.
          </p>
        ) : isLoading ? (
          <p className="text-sm text-muted-foreground">Validando link...</p>
        ) : !validation?.valid ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Este link expirou ou já foi usado. Peça um novo link ao suporte.
            </p>
            <Button asChild variant="outline">
              <Link to="/login">Ir para o login</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <h1 className="font-display text-2xl font-bold tracking-tight">
                Nova senha
              </h1>
              <p className="text-sm text-muted-foreground">
                Conta: <span className="font-medium text-foreground">{validation.email}</span>
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="newPassword">Nova senha</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className="pr-10"
                  {...register("newPassword")}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-xs text-destructive">{errors.newPassword.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" loading={isSubmitting}>
              Salvar nova senha
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
