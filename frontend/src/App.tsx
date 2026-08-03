import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { RoleRoute } from "@/routes/RoleRoute";
import { AuthLayout } from "@/layouts/AuthLayout";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PublicStoreLayout } from "@/layouts/PublicStoreLayout";

import { LoginPage } from "@/pages/auth/LoginPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { CompaniesPage } from "@/pages/companies/CompaniesPage";
import { UsersPage } from "@/pages/users/UsersPage";
import { VehiclesPage } from "@/pages/vehicles/VehiclesPage";
import { CustomersPage } from "@/pages/customers/CustomersPage";
import { LeadsPage } from "@/pages/leads/LeadsPage";
import { SellersPage } from "@/pages/sellers/SellersPage";
import { ProposalsPage } from "@/pages/proposals/ProposalsPage";
import { SettingsPage } from "@/pages/settings/SettingsPage";
import { ProfilePage } from "@/pages/profile/ProfilePage";
import { ApiDocsPage } from "@/pages/api-docs/ApiDocsPage";
import { ApiTokensPage } from "@/pages/api-tokens/ApiTokensPage";
import { LogsPage } from "@/pages/logs/LogsPage";
import { PlansPage } from "@/pages/plans/PlansPage";
import { StoreHomePage } from "@/pages/store/StoreHomePage";
import { StoreVehiclePage } from "@/pages/store/StoreVehiclePage";
import { StoreContactPage } from "@/pages/store/StoreContactPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
      </Route>

      <Route path="/loja/:slug?" element={<PublicStoreLayout />}>
        <Route index element={<StoreHomePage />} />
        <Route path="veiculo/:id" element={<StoreVehiclePage />} />
        <Route path="contato" element={<StoreContactPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/perfil" element={<ProfilePage />} />

          <Route element={<RoleRoute roles={["SUPER_ADMIN"]} />}>
            <Route path="/empresas" element={<CompaniesPage />} />
            <Route path="/planos" element={<PlansPage />} />
            <Route path="/tokens-api" element={<ApiTokensPage />} />
            <Route path="/logs" element={<LogsPage />} />
            <Route path="/documentacao" element={<ApiDocsPage />} />
            <Route path="/admin/api" element={<ApiDocsPage />} />
          </Route>

          <Route element={<RoleRoute roles={["SUPER_ADMIN", "STORE_ADMIN"]} />}>
            <Route path="/usuarios" element={<UsersPage />} />
            <Route path="/vendedores" element={<SellersPage />} />
            <Route path="/configuracoes" element={<SettingsPage />} />
          </Route>

          <Route element={<RoleRoute roles={["STORE_ADMIN", "SELLER", "SUPER_ADMIN"]} />}>
            <Route path="/veiculos" element={<VehiclesPage />} />
            <Route path="/clientes" element={<CustomersPage />} />
            <Route path="/leads" element={<LeadsPage />} />
            <Route path="/propostas" element={<ProposalsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
