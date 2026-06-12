import type { CourseStatus } from "./types";

interface StatusMeta {
  label: string;
  tone: "neutral" | "success" | "warning" | "info";
}

export const courseStatusMeta: Record<CourseStatus, StatusMeta> = {
  DRAFT: { label: "Borrador", tone: "neutral" },
  PUBLISHED: { label: "Publicado", tone: "success" },
  HIDDEN: { label: "Oculto", tone: "warning" },
  FINISHED: { label: "Finalizado", tone: "info" },
};

export const courseStatusOptions = (
  Object.keys(courseStatusMeta) as CourseStatus[]
).map((status) => ({
  value: status,
  label: courseStatusMeta[status].label,
}));
