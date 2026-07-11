import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

// `secondary` y `outline` comparten estilo (relleno blanco + borde) por
// compatibilidad con llamadas existentes; `danger` es contorno rojo (brief).
const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white shadow-soft hover:bg-brand-700 hover:shadow-elevated",
  secondary:
    "border border-gray-300 bg-card text-gray-800 hover:bg-gray-50",
  outline: "border border-gray-300 bg-card text-gray-800 hover:bg-gray-50",
  ghost: "text-gray-700 hover:bg-gray-100",
  danger: "border border-brand-600 bg-card text-brand-600 hover:bg-brand-50",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:border-transparent disabled:bg-gray-100 disabled:text-gray-400 disabled:hover:bg-gray-100",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
