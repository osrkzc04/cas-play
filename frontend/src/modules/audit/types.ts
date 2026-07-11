export type AuditAction =
  | "LOGIN"
  | "LOGIN_FAILED"
  | "COURSE_CREATED"
  | "COURSE_PUBLISHED"
  | "COURSE_HIDDEN"
  | "ENROLLMENT_CREATED"
  | "CERTIFICATE_ISSUED"
  | "PASSWORD_CHANGED"
  | "USER_UPDATED";

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: AuditAction;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}
