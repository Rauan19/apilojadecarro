import { NavLink } from "react-router-dom";
import {
  IconCode,
  IconCompanies,
  IconCustomers,
  IconLeads,
  IconLogs,
  IconOverview,
  IconPlans,
  IconProfile,
  IconProposal,
  IconSellers,
  IconSettings,
  IconStockRows,
  IconTokens,
  IconUsers,
  IconVehicle,
} from "@/components/icons/instrument-icons";
import type { SVGProps } from "react";
import { useAuth } from "@/hooks/useAuth";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

interface NavItem {
  label: string;
  to: string;
  icon: (props: SVGProps<SVGSVGElement>) => React.ReactElement;
}

const navByRole: Record<Role, NavItem[]> = {
  SUPER_ADMIN: [
    { label: "Início", to: "/dashboard", icon: IconOverview },
    { label: "Clientes", to: "/empresas", icon: IconCompanies },
    { label: "Planos", to: "/planos", icon: IconPlans },
    { label: "Usuários", to: "/usuarios", icon: IconUsers },
    { label: "Tokens API", to: "/tokens-api", icon: IconTokens },
    { label: "Logs", to: "/logs", icon: IconLogs },
    { label: "Docs API", to: "/documentacao", icon: IconCode },
  ],
  STORE_ADMIN: [
    { label: "Início", to: "/dashboard", icon: IconOverview },
    { label: "Veículos", to: "/veiculos", icon: IconVehicle },
    { label: "Ver meu estoque", to: "/meu-estoque", icon: IconStockRows },
    { label: "Clientes", to: "/clientes", icon: IconCustomers },
    { label: "Leads", to: "/leads", icon: IconLeads },
    { label: "Propostas", to: "/propostas", icon: IconProposal },
    { label: "Vendedores", to: "/vendedores", icon: IconSellers },
    { label: "Usuários", to: "/usuarios", icon: IconUsers },
    { label: "Configurações", to: "/configuracoes", icon: IconSettings },
  ],
  SELLER: [
    { label: "Início", to: "/dashboard", icon: IconOverview },
    { label: "Veículos", to: "/veiculos", icon: IconVehicle },
    { label: "Ver meu estoque", to: "/meu-estoque", icon: IconStockRows },
    { label: "Clientes", to: "/clientes", icon: IconCustomers },
    { label: "Leads", to: "/leads", icon: IconLeads },
    { label: "Propostas", to: "/propostas", icon: IconProposal },
    { label: "Perfil", to: "/perfil", icon: IconProfile },
  ],
};

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const items = user ? navByRole[user.role] : [];

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-[4.5rem] items-center border-b border-sidebar-border px-4 sm:h-20 sm:px-5">
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
                "group relative flex min-h-11 items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-primary/[0.07] text-primary"
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
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 shrink-0 bg-primary" aria-hidden />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-6 py-4">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          EstoqueAuto &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
