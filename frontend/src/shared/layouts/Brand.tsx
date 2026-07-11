import { Link } from "react-router-dom";

import { cn } from "@/shared/lib/cn";
import { useTheme } from "@/shared/theme/useTheme";

interface BrandProps {
  to?: string;
  /** `full` = logotipo horizontal; `icon` = monograma compacto. */
  variant?: "full" | "icon";
  className?: string;
}

export function Brand({ to = "/", variant = "full", className }: BrandProps) {
  // La variante de logo sigue el tema: tinta oscura en claro, tinta clara en oscuro.
  const { theme } = useTheme();
  const form = variant === "icon" ? "icon" : "horizontal";
  const src = `/brand/cas-logo-${form}-${theme}.png`;

  return (
    <Link
      to={to}
      aria-label="Culinary Arts School"
      className={cn("inline-flex items-center", className)}
    >
      <img
        src={src}
        alt="Culinary Arts School"
        className={variant === "icon" ? "h-9 w-auto" : "h-9 w-auto"}
      />
    </Link>
  );
}
