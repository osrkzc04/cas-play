import type { HTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "gold";
type Variant = "soft" | "solid" | "outline";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  /** `soft` (relleno tenue, por defecto), `solid` (relleno pleno) u `outline`. */
  variant?: Variant;
}

// `neutral` usa la escala neutra tematizable; los demás tonos son colores de
// estado (no tokenizados), por lo que llevan variante `dark:` para conservar el
// contraste en modo oscuro. `solid` es saturado y no la necesita.
const variantToneClasses: Record<Variant, Record<Tone, string>> = {
  soft: {
    neutral: "bg-gray-100 text-gray-700",
    success: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300",
    warning: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
    danger: "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300",
    info: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
    gold: "bg-gold-100 text-gold-700 dark:bg-gold-900/40 dark:text-gold-300",
  },
  solid: {
    neutral: "bg-zinc-800 text-white",
    success: "bg-green-600 text-white",
    warning: "bg-amber-500 text-white",
    danger: "bg-brand-600 text-white",
    info: "bg-blue-600 text-white",
    gold: "bg-gold-500 text-white",
  },
  outline: {
    neutral: "border border-gray-300 text-gray-700",
    success: "border border-green-300 text-green-700 dark:border-green-700 dark:text-green-300",
    warning: "border border-amber-300 text-amber-800 dark:border-amber-700 dark:text-amber-300",
    danger: "border border-brand-300 text-brand-700 dark:border-brand-700 dark:text-brand-300",
    info: "border border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300",
    gold: "border border-gold-300 text-gold-700 dark:border-gold-700 dark:text-gold-300",
  },
};

export function Badge({
  tone = "neutral",
  variant = "soft",
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variantToneClasses[variant][tone],
        className,
      )}
      {...props}
    />
  );
}
