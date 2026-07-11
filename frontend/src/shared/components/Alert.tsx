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

const toneConfig: Record<Tone, { classes: string; icon: LucideIcon }> = {
  error: { classes: "border-brand-200 bg-brand-50 text-brand-700", icon: XCircle },
  success: {
    classes: "border-green-200 bg-green-50 text-green-700",
    icon: CheckCircle2,
  },
  info: { classes: "border-blue-200 bg-blue-50 text-blue-700", icon: Info },
  warning: {
    classes: "border-amber-200 bg-amber-50 text-amber-800",
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
  return (
    <div
      role="alert"
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
