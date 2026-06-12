import type { Role } from "./types";

export const roleLabels: Record<Role, string> = {
  ADMIN: "Administrador",
  INSTRUCTOR: "Instructor",
  STUDENT: "Estudiante",
};

export const STAFF_ROLES: Role[] = ["ADMIN", "INSTRUCTOR"];

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
