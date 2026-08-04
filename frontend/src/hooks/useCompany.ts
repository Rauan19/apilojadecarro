import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { settingsService } from "@/services/settings.service";
import { resolveMediaUrl } from "@/utils/mediaUrl";

/** Dados da loja do usuário logado (logo, nome, slug) para o topo do painel. */
export function useCompany() {
  const { user } = useAuth();
  const companyId = user?.companyId ?? undefined;
  const isStoreUser = user?.role === "STORE_ADMIN" || user?.role === "SELLER";

  const { data: settings } = useQuery({
    queryKey: ["settings", companyId],
    queryFn: () => settingsService.get(companyId),
    enabled: !!companyId && isStoreUser,
    staleTime: 0,
    refetchOnMount: "always",
  });

  return {
    companyId,
    isSuperAdmin: user?.role === "SUPER_ADMIN",
    isStoreAdmin: user?.role === "STORE_ADMIN",
    isSeller: user?.role === "SELLER",
    companyName: settings?.name ?? null,
    companySlug: settings?.slug ?? null,
    companyLogo: resolveMediaUrl(settings?.logo),
    primaryColor:
      ((settings?.settings as Record<string, any> | null)?.theme?.primaryColor as string | undefined) ??
      null,
  };
}
