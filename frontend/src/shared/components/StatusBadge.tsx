import { Badge } from "./Badge";

export type CourseStatus = "DRAFT" | "PUBLISHED" | "HIDDEN" | "FINISHED";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "gold";

// Mapeo único estado de curso (backend) → tono + etiqueta en español.
const courseStatusConfig: Record<
  CourseStatus,
  { tone: Tone; label: string }
> = {
  DRAFT: { tone: "neutral", label: "Borrador" },
  PUBLISHED: { tone: "success", label: "Publicado" },
  HIDDEN: { tone: "warning", label: "Oculto" },
  FINISHED: { tone: "info", label: "Finalizado" },
};

interface StatusBadgeProps {
  status: CourseStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { tone, label } = courseStatusConfig[status];
  return (
    <Badge tone={tone} className={className}>
      {label}
    </Badge>
  );
}
