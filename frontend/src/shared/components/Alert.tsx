import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

type Tone = "error" | "success" | "info";

const toneClasses: Record<Tone, string> = {
  error: "border-red-200 bg-red-50 text-red-700",
  success: "border-green-200 bg-green-50 text-green-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
};

interface AlertProps {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}

export function Alert({ tone = "info", children, className }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}
