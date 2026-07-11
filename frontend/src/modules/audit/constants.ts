import type { AuditAction } from "./types";

export const auditActionLabels: Record<AuditAction, string> = {
  LOGIN: "Inicio de sesión",
  LOGIN_FAILED: "Inicio fallido",
  COURSE_CREATED: "Curso creado",
  COURSE_PUBLISHED: "Curso publicado",
  COURSE_HIDDEN: "Curso oculto",
  ENROLLMENT_CREATED: "Matrícula creada",
  CERTIFICATE_ISSUED: "Certificado emitido",
  PASSWORD_CHANGED: "Contraseña cambiada",
  USER_UPDATED: "Usuario actualizado",
};

// Acciones sensibles se resaltan en rojo; el resto en neutro.
export const auditActionTone: Record<
  AuditAction,
  "neutral" | "danger" | "success" | "info"
> = {
  LOGIN: "neutral",
  LOGIN_FAILED: "danger",
  COURSE_CREATED: "info",
  COURSE_PUBLISHED: "success",
  COURSE_HIDDEN: "neutral",
  ENROLLMENT_CREATED: "info",
  CERTIFICATE_ISSUED: "success",
  PASSWORD_CHANGED: "neutral",
  USER_UPDATED: "neutral",
};

export const auditActionOptions = (
  Object.keys(auditActionLabels) as AuditAction[]
).map((action) => ({ value: action, label: auditActionLabels[action] }));
