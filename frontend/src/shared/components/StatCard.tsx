import type { LucideIcon } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { Card } from "./Card";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  /** Texto contextual debajo del valor (p. ej. "+3 esta semana"). */
  hint?: string;
  /** Acento dorado para tarjetas de logro (certificados, cursos completados). */
  accent?: "brand" | "gold";
  className?: string;
}

// Tarjeta de métrica para dashboards por rol (admin / instructor / estudiante).
export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  accent = "brand",
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "flex items-center gap-4 p-5 transition-shadow hover:shadow-elevated",
        className,
      )}
    >
      {Icon && (
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
            accent === "gold"
              ? "bg-gold-50 text-gold-600"
              : "bg-brand-50 text-brand-600",
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          {label}
        </p>
        <p className="text-2xl font-bold tracking-tightish text-gray-900">
          {value}
        </p>
        {hint && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
    </Card>
  );
}
