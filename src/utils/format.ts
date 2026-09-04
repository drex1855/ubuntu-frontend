import type {
  AccountGender,
  AccountRole,
  AccountStatus,
  ChecklistItemStatus,
  FineStatus,
  LoanRequestStatus,
  MaintenanceRequestStatus,
} from "../api/types";

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("es", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("es", { dateStyle: "medium" });
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es", { style: "currency", currency: "USD" }).format(value);
}


export function formatPesos(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("es").format(value);
}

export function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Convierte "6:47" o "-6:47" a minutos totales (407, o -407). Null si el formato no es válido. */
export function parseTimeToMinutes(value: string): number | null {
  const match = value.trim().match(/^(-)?(\d+):([0-5]?\d)$/);
  if (!match) return null;

  const sign = match[1] ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3]);
  return sign * (hours * 60 + minutes);
}

/** Convierte minutos totales de vuelta a formato "H:MM" (o "-H:MM" si es negativo). */
export function formatMinutesAsTime(totalMinutes: number): string {
  const sign = totalMinutes < 0 ? "-" : "";
  const abs = Math.abs(totalMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  return `${sign}${hours}:${minutes.toString().padStart(2, "0")}`;
}

const ROLE_LABELS: Record<AccountRole, string> = {
  Admin: "Administrador",
  Modelo: "Modelo",
  Monitor: "Monitor",
};

const GENDER_LABELS: Record<AccountGender, string> = {
  Femenino: "Femenino",
  Masculino: "Masculino",
  Otro: "Otro",
};

const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  Activo: "Activo",
  Desactivado: "Desactivado",
};

const CHECKLIST_STATUS_LABELS: Record<ChecklistItemStatus, string> = {
  Bueno: "Bueno",
  Malo: "Malo",
};

const MAINTENANCE_STATUS_LABELS: Record<MaintenanceRequestStatus, string> = {
  Pendiente: "Pendiente",
  EnProceso: "En proceso",
  Resuelta: "Resuelta",
};

const LOAN_STATUS_LABELS: Record<LoanRequestStatus, string> = {
  Pendiente: "Pendiente",
  Aprobada: "Aprobada",
  Rechazada: "Rechazada",
};

const FINE_STATUS_LABELS: Record<FineStatus, string> = {
  PendientePorCobrar: "Pendiente por cobrar",
  Pagada: "Pagada",
  Cancelada: "Cancelada",
};

export function roleLabel(role: AccountRole): string {
  return ROLE_LABELS[role];
}

export function genderLabel(gender: AccountGender): string {
  return GENDER_LABELS[gender];
}

export function accountStatusLabel(status: AccountStatus): string {
  return ACCOUNT_STATUS_LABELS[status];
}

export function checklistStatusLabel(status: ChecklistItemStatus): string {
  return CHECKLIST_STATUS_LABELS[status];
}

export function maintenanceStatusLabel(status: MaintenanceRequestStatus): string {
  return MAINTENANCE_STATUS_LABELS[status];
}

export function loanStatusLabel(status: LoanRequestStatus): string {
  return LOAN_STATUS_LABELS[status];
}

export function fineStatusLabel(status: FineStatus): string {
  return FINE_STATUS_LABELS[status];
}
