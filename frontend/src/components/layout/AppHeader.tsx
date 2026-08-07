import { useNavigate } from "react-router-dom";
import {
  IconLogout,
  IconMenuTicks,
  IconProfile,
  IconSettings,
} from "@/components/icons/instrument-icons";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useAuth } from "@/hooks/useAuth";
import { getInitials } from "@/lib/utils";
import { roleLabels } from "@/utils/labels";
import { toast } from "sonner";

export function AppHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success("Sessão encerrada com sucesso");
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-border bg-white px-3 sm:h-16 sm:px-5">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 lg:hidden"
          onClick={onMenuClick}
          aria-label="Abrir menu"
        >
          <IconMenuTicks className="h-5 w-5" />
        </Button>
        <div className="min-w-0 lg:hidden">
          <BrandLogo preferStoreBrand showWordmark className="scale-90 origin-left" />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full py-1 pl-1 pr-1.5 transition-colors hover:bg-secondary sm:pr-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">{getInitials(user?.name)}</AvatarFallback>
              </Avatar>
              <div className="hidden min-w-0 text-left leading-tight sm:block">
                <p className="truncate text-sm font-medium max-w-[9rem]">{user?.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {user ? roleLabels[user.role] : ""}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/perfil")}>
              <IconProfile className="h-4 w-4" /> Meu perfil
            </DropdownMenuItem>
            {user?.role === "STORE_ADMIN" && (
              <DropdownMenuItem onClick={() => navigate("/configuracoes")}>
                <IconSettings className="h-4 w-4" /> Configurações
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onClick={handleLogout}>
              <IconLogout className="h-4 w-4" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
