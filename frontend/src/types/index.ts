export type Role = "SUPER_ADMIN" | "STORE_ADMIN" | "SELLER";

export type CompanyStatus = "ACTIVE" | "BLOCKED" | "INACTIVE";

export type VehicleStatus = "AVAILABLE" | "RESERVED" | "SOLD" | "MAINTENANCE";

export type VehicleType = "CAR" | "MOTORCYCLE" | "TRUCK";

export type FuelType =
  | "FLEX"
  | "GASOLINE"
  | "ETHANOL"
  | "DIESEL"
  | "ELECTRIC"
  | "HYBRID"
  | "GNV";

export type Transmission = "MANUAL" | "AUTOMATIC" | "CVT" | "DCT";

export type LeadOrigin = "WHATSAPP" | "SITE" | "MANUAL";

export type LeadStatus = "NEW" | "ATTENDING" | "NEGOTIATION" | "SALE" | "LOST";

export type ProposalStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";

export type ScheduleStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

// ---------------------------------------------------------------------------
// Envelope de resposta da API
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown[] | null;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  companyId?: string;
}

export interface VehiclesListParams extends PaginationParams {
  type?: VehicleType;
}

export interface UsersListParams extends PaginationParams {
  role?: Role;
  active?: boolean;
}

// ---------------------------------------------------------------------------
// Entidades
// ---------------------------------------------------------------------------

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceMonthly: number;
  features: string[];
  maxVehicles: number | null;
  maxUsers: number | null;
  active: boolean;
  sortOrder: number;
  /** null = plano público; preenchido = plano exclusivo daquela loja. */
  companyId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  document: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  logo: string | null;
  website: string | null;
  customDomain?: string | null;
  planId: string | null;
  plan?: SubscriptionPlan | null;
  status: CompanyStatus;
  settings: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlanBillingRow {
  planId: string;
  name: string;
  priceMonthly: number;
  count: number;
  mrr: number;
}

export interface CompanyStatsOverview {
  total: number;
  byStatus: Record<CompanyStatus, number>;
  activeSubscriptions: number;
  mrr: number;
  byPlan: PlanBillingRow[];
}

export interface User {
  id: string;
  companyId: string | null;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  phone: string | null;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
  company?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  companyId: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface UserRef {
  id: string;
  name: string;
  email: string;
}

export interface Seller {
  id: string;
  companyId: string;
  userId: string;
  commission: number | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  user: User;
}

export interface VehicleImage {
  id: string;
  vehicleId: string;
  companyId: string;
  url: string;
  order: number;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  companyId: string;
  createdById: string | null;
  type: VehicleType;
  brand: string;
  model: string;
  version: string | null;
  year: number;
  yearModel: number;
  price: number;
  originalPrice?: number | null;
  purchasePrice?: number | null;
  soldPrice?: number | null;
  mileage: number;
  plate: string | null;
  renavam: string | null;
  fuel: FuelType;
  transmission: Transmission;
  color: string | null;
  doors: number;
  description: string | null;
  optionals: string | null;
  status: VehicleStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  images: VehicleImage[];
}

export interface Customer {
  id: string;
  companyId: string;
  sellerId: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  seller: UserRef | null;
}

export interface VehicleRef {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  originalPrice?: number | null;
  status?: VehicleStatus;
}

export interface CustomerRef {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface Lead {
  id: string;
  companyId: string;
  sellerId: string | null;
  customerId: string | null;
  vehicleId: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  origin: LeadOrigin;
  status: LeadStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  seller: UserRef | null;
  customer: CustomerRef | null;
  vehicle: VehicleRef | null;
}

export interface Proposal {
  id: string;
  companyId: string;
  vehicleId: string;
  customerId: string;
  sellerId: string | null;
  value: number;
  status: ProposalStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  seller: UserRef | null;
  customer: CustomerRef;
  vehicle: VehicleRef;
}

export interface Schedule {
  id: string;
  companyId: string;
  vehicleId: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  date: string;
  notes: string | null;
  status: ScheduleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ApiToken {
  id: string;
  companyId: string;
  name: string;
  token: string;
  active: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface ApiLog {
  id: string;
  companyId: string | null;
  apiTokenId: string | null;
  endpoint: string;
  method: string;
  ip: string | null;
  statusCode: number | null;
  responseTime: number | null;
  userAgent: string | null;
  createdAt: string;
}

export interface CompanySettings {
  id: string;
  name: string;
  slug: string;
  /** CPF ou CNPJ da loja — exigido para assinar um plano. */
  document: string | null;
  phone: string | null;
  email: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  logo: string | null;
  website: string | null;
  customDomain: string | null;
  settings: Record<string, unknown> | null;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export interface DashboardCounts {
  vehicles: {
    total: number;
    available: number;
    sold: number;
    reserved: number;
    maintenance: number;
  };
  customers: number;
  users: number;
  sellers: number;
  proposals: number;
  schedules: number;
  leads: Record<LeadStatus, number>;
}

export interface DashboardCharts {
  vehiclesByMonth: { month: string; count: number }[];
  leadsByStatus: { status: LeadStatus; count: number }[];
  vehiclesByStatus: { status: VehicleStatus; count: number }[];
  revenueByMonth: { month: string; total: number }[];
}

export interface DashboardData {
  counts: DashboardCounts;
  charts: DashboardCharts;
  revenue: {
    total: number;
    acceptedProposals: number;
    vehicleSales: {
      revenue: number;
      cost: number;
      profit: number;
      soldWithPrice: number;
    };
  };
  global?: {
    companies: number;
    billing: {
      mrr: number;
      total: number;
      activeSubscriptions: number;
      byPlan: PlanBillingRow[];
    };
    totals: DashboardCounts;
  };
}

// ---------------------------------------------------------------------------
// DTOs de formulário
// ---------------------------------------------------------------------------

export interface CreateCompanyPayload {
  name: string;
  slug?: string;
  document?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  logo?: string;
  website?: string;
  customDomain?: string;
  planId?: string;
  status?: CompanyStatus;
  settings?: string;
  adminName?: string;
  adminEmail?: string;
  adminPassword: string;
}

export type UpdateCompanyPayload = Partial<
  Omit<CreateCompanyPayload, "adminName" | "adminEmail" | "adminPassword">
>;

export interface CreateCompanyResult {
  company: Company;
  admin: {
    id: string;
    name: string;
    email: string;
  };
  passwordChangeUrl: string;
  passwordChangeExpiresAt: string;
}

export interface PasswordChangeLinkResult {
  url: string;
  expiresAt: string;
  adminEmail: string;
  adminName: string;
}

export interface CreatePlanPayload {
  name: string;
  slug?: string;
  description?: string;
  priceMonthly: number;
  features: string[];
  maxVehicles?: number | null;
  maxUsers?: number | null;
  active?: boolean;
  sortOrder?: number;
}

export type UpdatePlanPayload = Partial<CreatePlanPayload>;

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: Role;
  companyId?: string;
  phone?: string;
  active?: boolean;
}

export type UpdateUserPayload = Partial<Omit<CreateUserPayload, "password">> & {
  password?: string;
};

export interface CreateVehiclePayload {
  type?: VehicleType;
  brand: string;
  model: string;
  version?: string;
  year: number;
  yearModel: number;
  price: number;
  originalPrice?: number | null;
  purchasePrice?: number | null;
  soldPrice?: number | null;
  mileage?: number;
  plate?: string;
  renavam?: string;
  fuel?: FuelType;
  transmission?: Transmission;
  color?: string;
  doors?: number;
  description?: string;
  optionals?: string[];
  status?: VehicleStatus;
  notes?: string;
}

export type UpdateVehiclePayload = Partial<CreateVehiclePayload>;

export interface CreateCustomerPayload {
  name: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  notes?: string;
  sellerId?: string;
}

export type UpdateCustomerPayload = Partial<CreateCustomerPayload>;

export interface CreateLeadPayload {
  name: string;
  phone?: string;
  email?: string;
  origin?: LeadOrigin;
  status?: LeadStatus;
  notes?: string;
  customerId?: string;
  vehicleId?: string;
  sellerId?: string;
}

export type UpdateLeadPayload = Partial<CreateLeadPayload>;

export interface CreateSellerPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  commission?: number;
  notes?: string;
  active?: boolean;
}

export type UpdateSellerPayload = Partial<Omit<CreateSellerPayload, "password">> & {
  password?: string;
};

export interface CreateProposalPayload {
  vehicleId: string;
  customerId: string;
  sellerId?: string;
  value: number;
  status?: ProposalStatus;
  notes?: string;
}

export type UpdateProposalPayload = Partial<CreateProposalPayload>;

export interface UpdateSettingsPayload {
  name?: string;
  document?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  logo?: string;
  website?: string;
  customDomain?: string | null;
  settings?: string;
}

export interface CreateApiTokenPayload {
  companyId: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Loja pública
// ---------------------------------------------------------------------------

export interface PublicCompanyInfo {
  name: string;
  slug: string;
  logo: string | null;
  phone: string | null;
  email: string;
  city: string | null;
  customDomain: string | null;
  settings: Record<string, unknown> | null;
}

export interface PublicVehicleFilters {
  page?: number;
  limit?: number;
  search?: string;
  type?: VehicleType;
  brand?: string;
  model?: string;
  year?: number;
  minPrice?: number;
  maxPrice?: number;
  transmission?: Transmission;
  fuel?: FuelType;
  color?: string;
}

export type PublicLeadInterestType =
  | "INTEREST"
  | "FINANCING"
  | "CASH"
  | "TRADE_IN"
  | "VISIT";

export interface CreatePublicLeadPayload {
  name: string;
  phone?: string;
  email?: string;
  interestType?: PublicLeadInterestType;
  notes?: string;
  vehicleId?: string;
}

export interface CreatePublicSchedulePayload {
  name: string;
  phone?: string;
  email?: string;
  date: string;
  notes?: string;
  vehicleId?: string;
}
