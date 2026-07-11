import type { Role } from "./types";

export const roleLabels: Record<Role, string> = {
  ADMIN: "Administrador",
  INSTRUCTOR: "Instructor",
  STUDENT: "Estudiante",
};

// Traduce el nombre de rol del backend (ADMIN/INSTRUCTOR/STUDENT) a su etiqueta
// en español; si llega un valor desconocido se devuelve tal cual.
export function getRoleLabel(name: string): string {
  return roleLabels[name as Role] ?? name;
}

export const STAFF_ROLES: Role[] = ["ADMIN", "INSTRUCTOR"];

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
