import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useAuth } from "@/hooks/useAuth";

const loginSchema = z.object({
  email: z.string().min(1, "Informe seu e-mail").email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  if (isAuthenticated) {
    const from = (location.state as { from?: Location })?.from?.pathname ?? "/dashboard";
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await login(values);
      toast.success("Bem-vindo de volta!");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível autenticar");
    }
  };

  const fillDemo = () => {
    setValue("email", "admin@sistema.com");
    setValue("password", "123456");
  };

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_0.95fr]">
      <div className="relative hidden overflow-hidden border-r border-border lg:block">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(105deg, rgba(227,28,35,0.92) 0%, rgba(227,28,35,0.72) 42%, rgba(26,29,35,0.7) 100%), url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1600&q=80')",
          }}
        />
        <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white">
          <BrandLogo inverted subtitle="Gestão para revendas" markClassName="h-10 w-10" />

          <div className="max-w-md space-y-4">
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight">
              Compre e venda com o ritmo do marketplace
            </h1>
            <p className="max-w-sm text-sm leading-relaxed text-white/85">
              Estoque, leads e equipe de vendas em um painel no estilo Webmotors, direto ao ponto.
            </p>
          </div>

          <p className="text-xs text-white/55">&copy; {new Date().getFullYear()} LojaDeCarro</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center bg-white px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="mb-8 lg:hidden">
            <BrandLogo subtitle="Painel" />
          </div>

          <div className="mb-8 space-y-1.5">
            <h2 className="font-display text-2xl font-bold tracking-tight">Entrar</h2>
            <p className="text-sm text-muted-foreground">Use o e-mail e a senha da sua conta.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" autoComplete="email" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="pr-10"
                  {...register("password")}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full" loading={isSubmitting}>
              Acessar painel
            </Button>

            <button
              type="button"
              onClick={fillDemo}
              className="w-full text-center text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              Preencher demo (admin)
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
