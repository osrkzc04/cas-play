import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Etiqueta superior opcional (p. ej. nombre del módulo o sección). */
  eyebrow?: string;
  /** Acciones alineadas a la derecha (botones, filtros). */
  actions?: ReactNode;
  className?: string;
}

// Encabezado de página consistente en todas las vistas autenticadas.
export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-gray-200 pb-5 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-bold tracking-tightish text-gray-900">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
