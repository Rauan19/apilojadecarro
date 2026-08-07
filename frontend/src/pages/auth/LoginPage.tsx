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
import { useAuth } from "@/hooks/useAuth";
import { BRAND } from "@/lib/brand";

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

  return (
    <div className="grid min-h-screen bg-[#12141A] lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_460px]">
      <section className="relative hidden min-h-screen lg:block">
        <img
          src="/brand/login-showroom.jpg"
          alt="Showroom de concessionária"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/15" />
        <div className="absolute left-0 top-0 h-full w-1.5 bg-primary" />

        <div className="absolute inset-0 flex items-center justify-center p-12">
          <img
            src={BRAND.logoUrl}
            alt={BRAND.name}
            className="h-44 w-auto max-w-[min(420px,70%)] object-contain drop-shadow-[0_12px_32px_rgba(0,0,0,0.5)] xl:h-52"
          />
        </div>
      </section>

      <section className="relative flex min-h-screen flex-col border-l border-white/10 bg-[#12141A] px-8 py-10 sm:px-12">
        <div className="my-auto w-full max-w-[320px] self-center py-12">
          <div className="mb-10 flex flex-col items-center text-center">
            <img
              src={BRAND.logoUrl}
              alt={BRAND.name}
              className="h-36 w-auto max-w-full object-contain sm:h-40"
            />
            <p className="mt-4 text-[11px] uppercase tracking-[0.14em] text-white/45">
              {BRAND.domain}
            </p>
          </div>

          <h1 className="font-display text-3xl font-bold tracking-tight text-white">Entrar</h1>
          <p className="mt-2 text-sm text-white/55">Use o e-mail e a senha da sua conta.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-white/65">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                className="h-11 rounded-none border-white/15 bg-[#1a1d24] px-3 text-white shadow-none placeholder:text-white/30 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0"
                {...register("email")}
              />
              {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-white/65">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="h-11 rounded-none border-white/15 bg-[#1a1d24] px-3 pr-11 text-white shadow-none placeholder:text-white/30 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0"
                  {...register("password")}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-white/40 hover:text-white/80"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              className="h-11 w-full text-sm font-semibold tracking-wide"
              loading={isSubmitting}
            >
              Entrar
            </Button>
          </form>
        </div>

        <p className="mt-auto text-center text-[11px] text-white/35">
          &copy; {new Date().getFullYear()} {BRAND.name}
        </p>
      </section>
    </div>
  );
}
