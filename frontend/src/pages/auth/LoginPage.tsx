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
import { LoginShowroomScene } from "@/components/auth/LoginShowroomScene";

const loginSchema = z.object({
  email: z.string().min(1, "Informe seu e-mail").email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const inputClass =
  "h-12 rounded-none border-0 border-b border-white/15 bg-transparent px-0 text-[15px] text-white shadow-none placeholder:text-white/30 focus-visible:border-primary focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0";

function BrandWordmark({ className }: { className?: string }) {
  return (
    <p
      className={
        className ??
        "font-display text-[1.85rem] font-bold leading-none tracking-[-0.035em] drop-shadow-[0_2px_18px_rgba(0,0,0,0.85)] sm:text-[2.35rem] lg:text-5xl xl:text-[3.25rem]"
      }
    >
      <span className="text-white">ESTOQUE</span>
      <span className="text-primary">AUTO</span>
    </p>
  );
}

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
    const from = (location.state as { from?: { pathname?: string } })?.from?.pathname ?? "/dashboard";
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
    <div className="login-board relative min-h-svh overflow-hidden bg-[#0a0b0f]">
      {/* Cena full-bleed — pátio em movimento */}
      <div className="absolute inset-0">
        <LoginShowroomScene />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, rgba(10,11,15,0.4) 0%, rgba(10,11,15,0.1) 38%, rgba(10,11,15,0.02) 58%, rgba(18,20,26,0.9) 100%), linear-gradient(to top, rgba(10,11,15,0.82) 0%, rgba(10,11,15,0.35) 28%, transparent 52%)",
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-svh flex-col lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(360px,460px)]">
        {/* Lado marca — só desktop; no mobile o form manda */}
        <section className="login-brand-panel relative hidden min-h-0 flex-col justify-between px-10 pb-14 pt-10 lg:flex lg:px-14 xl:px-20">
          <div className="login-brand">
            <BrandWordmark />
            <span className="sr-only">{BRAND.name}</span>
          </div>

          <div className="login-copy relative mt-auto max-w-2xl">
            <div
              className="pointer-events-none absolute -inset-x-6 -bottom-6 -top-10 rounded-sm bg-gradient-to-t from-[#0a0b0f] via-[#0a0b0f]/80 to-transparent"
              aria-hidden
            />

            <h1 className="relative font-display text-[4.35rem] font-bold leading-[0.92] tracking-[-0.04em] text-white xl:text-[5rem]">
              <span className="block">Carros.</span>
              <span className="block">Motos.</span>
              <span className="block text-primary">Estoque vivo.</span>
            </h1>

            <p className="relative mt-6 max-w-lg text-xl font-medium leading-snug text-white/85">
              O pátio da loja no painel — cada veículo, cada lead, cada venda.
            </p>
          </div>
        </section>

        {/* Painel de acesso — prioridade no mobile */}
        <section className="login-panel relative flex min-h-svh flex-1 flex-col justify-center bg-[#12141A] px-6 py-8 sm:px-10 lg:min-h-0 lg:border-l lg:border-white/10 lg:px-12 lg:py-14">
          <div className="relative mx-auto w-full max-w-[360px]">
            <div className="login-brand mb-8 lg:hidden">
              <BrandWordmark className="font-display text-2xl font-bold leading-none tracking-[-0.03em]" />
              <span className="sr-only">{BRAND.name}</span>
            </div>

            <h2 className="font-display text-[1.65rem] font-bold tracking-tight text-white sm:text-2xl">
              Acesse sua loja
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/50">
              Entre com o e-mail da equipe pra abrir o painel.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-7 lg:mt-10">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[13px] font-medium text-white/55">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@sualoja.com.br"
                  className={inputClass}
                  {...register("email")}
                />
                {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[13px] font-medium text-white/55">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Sua senha"
                    className={`${inputClass} pr-11`}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-white/35 transition hover:text-white/85"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-400">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="mt-2 h-12 w-full text-[15px] font-semibold"
                loading={isSubmitting}
              >
                Entrar no painel
              </Button>
            </form>

            <p className="mt-10 text-center text-[11px] tracking-wide text-white/30 lg:mt-12">
              &copy; {new Date().getFullYear()} {BRAND.name}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
