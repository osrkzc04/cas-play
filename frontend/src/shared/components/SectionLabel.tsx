import type { HTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

// Micro-etiqueta institucional: mayúsculas, SemiBold, tracking amplio. Aporta
// el tono académico de la marca CAS en encabezados de sección y metadatos.
export function SectionLabel({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-[11px] font-semibold uppercase tracking-wider text-gray-500",
        className,
      )}
      {...props}
    />
  );
}
