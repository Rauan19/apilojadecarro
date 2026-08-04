import { NavLink } from "react-router-dom";
import {
  Building2,
  Car,
  FileText,
  KeyRound,
  LayoutDashboard,
  Settings,
  ScrollText,
  Target,
  UserCircle,
  UserCog,
  Users,
  Users2,
  Code2,
  Tags,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

const navByRole: Record<Role, NavItem[]> = {
  SUPER_ADMIN: [
    { label: "Início", to: "/dashboard", icon: LayoutDashboard },
    { label: "Clientes", to: "/empresas", icon: Building2 },
    { label: "Planos", to: "/planos", icon: Tags },
    { label: "Usuários", to: "/usuarios", icon: Users },
    { label: "Tokens API", to: "/tokens-api", icon: KeyRound },
    { label: "Logs", to: "/logs", icon: ScrollText },
    { label: "Docs API", to: "/documentacao", icon: Code2 },
  ],
  STORE_ADMIN: [
    { label: "Início", to: "/dashboard", icon: LayoutDashboard },
    { label: "Veículos", to: "/veiculos", icon: Car },
    { label: "Clientes", to: "/clientes", icon: Users2 },
    { label: "Leads", to: "/leads", icon: Target },
    { label: "Propostas", to: "/propostas", icon: FileText },
    { label: "Vendedores", to: "/vendedores", icon: UserCog },
    { label: "Usuários", to: "/usuarios", icon: Users },
    { label: "Configurações", to: "/configuracoes", icon: Settings },
  ],
  SELLER: [
    { label: "Início", to: "/dashboard", icon: LayoutDashboard },
    { label: "Veículos", to: "/veiculos", icon: Car },
    { label: "Clientes", to: "/clientes", icon: Users2 },
    { label: "Leads", to: "/leads", icon: Target },
    { label: "Propostas", to: "/propostas", icon: FileText },
    { label: "Perfil", to: "/perfil", icon: UserCircle },
  ],
};

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const items = user ? navByRole[user.role] : [];

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center border-b border-sidebar-border px-5">
        <BrandLogo preferStoreBrand subtitle="Painel de Gestão" />
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3 sm:px-3 sm:py-4">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "group flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-primary/10 text-primary shadow-none"
                  : "text-sidebar-foreground/70 hover:bg-secondary hover:text-sidebar-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
                  )}
                />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-6 py-4">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          LojaDeCarro SaaS &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
