import type { HTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "gold";
type Variant = "soft" | "solid" | "outline";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  /** `soft` (relleno tenue, por defecto), `solid` (relleno pleno) u `outline`. */
  variant?: Variant;
}

const variantToneClasses: Record<Variant, Record<Tone, string>> = {
  soft: {
    neutral: "bg-gray-100 text-gray-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-brand-100 text-brand-700",
    info: "bg-blue-100 text-blue-700",
    gold: "bg-gold-100 text-gold-700",
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
    success: "border border-green-300 text-green-700",
    warning: "border border-amber-300 text-amber-800",
    danger: "border border-brand-300 text-brand-700",
    info: "border border-blue-300 text-blue-700",
    gold: "border border-gold-300 text-gold-700",
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
