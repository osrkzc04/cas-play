import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/shared/lib/cn";

type Tone = "error" | "success" | "info" | "warning";

// Los colores de estado no son tematizables vía tokens (a diferencia de la
// escala neutra), así que se añade la variante `dark:` explícita para conservar
// el contraste en modo oscuro sobre superficies oscuras.
const toneConfig: Record<Tone, { classes: string; icon: LucideIcon }> = {
  error: {
    classes:
      "border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-300",
    icon: XCircle,
  },
  success: {
    classes:
      "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300",
    icon: CheckCircle2,
  },
  info: {
    classes:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
    icon: Info,
  },
  warning: {
    classes:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
    icon: AlertTriangle,
  },
};

interface AlertProps {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}

export function Alert({ tone = "info", children, className }: AlertProps) {
  const { classes, icon: Icon } = toneConfig[tone];
  // error/warning interrumpen al lector (assertive); success/info son
  // informativos y no deben interrumpir (polite).
  const role = tone === "error" || tone === "warning" ? "alert" : "status";
  return (
    <div
      role={role}
      className={cn(
        "flex items-start gap-2 rounded-lg border px-4 py-3 text-sm",
        classes,
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
