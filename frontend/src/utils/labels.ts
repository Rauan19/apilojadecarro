import type {
  CompanyStatus,
  FuelType,
  LeadOrigin,
  LeadStatus,
  ProposalStatus,
  Role,
  ScheduleStatus,
  Transmission,
  VehicleStatus,
  VehicleType,
} from "@/types";

export const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  STORE_ADMIN: "Admin da Loja",
  SELLER: "Vendedor",
};

export const companyStatusLabels: Record<CompanyStatus, string> = {
  ACTIVE: "Ativa",
  BLOCKED: "Bloqueada",
  INACTIVE: "Inativa",
};

export const companyStatusVariant: Record<CompanyStatus, "success" | "destructive" | "secondary"> = {
  ACTIVE: "success",
  BLOCKED: "destructive",
  INACTIVE: "secondary",
};

export const vehicleStatusLabels: Record<VehicleStatus, string> = {
  AVAILABLE: "Disponível",
  RESERVED: "Reservado",
  SOLD: "Vendido",
  MAINTENANCE: "Manutenção",
};

export const vehicleStatusVariant: Record<VehicleStatus, "success" | "warning" | "secondary" | "destructive"> = {
  AVAILABLE: "success",
  RESERVED: "warning",
  SOLD: "secondary",
  MAINTENANCE: "destructive",
};

export const vehicleTypeLabels: Record<VehicleType, string> = {
  CAR: "Carro",
  MOTORCYCLE: "Moto",
  TRUCK: "Caminhão",
};

export const fuelLabels: Record<FuelType, string> = {
  FLEX: "Flex",
  GASOLINE: "Gasolina",
  ETHANOL: "Etanol",
  DIESEL: "Diesel",
  ELECTRIC: "Elétrico",
  HYBRID: "Híbrido",
  GNV: "GNV",
};

export const transmissionLabels: Record<Transmission, string> = {
  MANUAL: "Manual",
  AUTOMATIC: "Automático",
  CVT: "CVT",
  DCT: "DCT (Automatizado)",
};

export const leadOriginLabels: Record<LeadOrigin, string> = {
  WHATSAPP: "WhatsApp",
  SITE: "Site",
  MANUAL: "Manual",
};

export const leadStatusLabels: Record<LeadStatus, string> = {
  NEW: "Novo",
  ATTENDING: "Em Atendimento",
  NEGOTIATION: "Negociação",
  SALE: "Venda",
  LOST: "Perdido",
};

export const leadStatusVariant: Record<LeadStatus, "default" | "warning" | "success" | "destructive" | "secondary"> = {
  NEW: "default",
  ATTENDING: "warning",
  NEGOTIATION: "warning",
  SALE: "success",
  LOST: "destructive",
};

export const proposalStatusLabels: Record<ProposalStatus, string> = {
  PENDING: "Pendente",
  ACCEPTED: "Aceita",
  REJECTED: "Recusada",
  CANCELLED: "Cancelada",
};

export const proposalStatusVariant: Record<ProposalStatus, "warning" | "success" | "destructive" | "secondary"> = {
  PENDING: "warning",
  ACCEPTED: "success",
  REJECTED: "destructive",
  CANCELLED: "secondary",
};

export const scheduleStatusLabels: Record<ScheduleStatus, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  COMPLETED: "Concluído",
};
