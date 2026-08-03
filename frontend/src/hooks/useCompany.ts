import { useAuth } from "./useAuth";

export function useCompany() {
  const { user } = useAuth();

  return {
    companyId: user?.companyId ?? undefined,
    isSuperAdmin: user?.role === "SUPER_ADMIN",
    isStoreAdmin: user?.role === "STORE_ADMIN",
    isSeller: user?.role === "SELLER",
  };
}
