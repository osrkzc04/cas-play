import { useState } from "react";
import { Star } from "lucide-react";

import { cn } from "@/shared/lib/cn";

interface StarRatingProps {
  /** Valor actual (1–5). Acepta decimales en modo lectura. */
  value: number;
  /** Si se pasa, las estrellas son interactivas (modo formulario). */
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-7 w-7",
} as const;

// Estrellas en oro: reservado para ratings (sprint de calificaciones).
export function StarRating({
  value,
  onChange,
  size = "md",
  className,
}: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);
  const interactive = Boolean(onChange);
  const shown = hover ?? value;

  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      role={interactive ? "radiogroup" : "img"}
      aria-label={`Calificación: ${value} de 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(shown);
        const StarIcon = (
          <Star
            className={cn(
              sizeClasses[size],
              filled ? "fill-gold-500 text-gold-500" : "fill-none text-gray-300",
            )}
            aria-hidden="true"
          />
        );

        if (!interactive) {
          return <span key={star}>{StarIcon}</span>;
        }

        return (
          <button
            key={star}
            type="button"
            aria-label={`${star} ${star === 1 ? "estrella" : "estrellas"}`}
            className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-1"
            onClick={() => onChange?.(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(null)}
          >
            {StarIcon}
          </button>
        );
      })}
    </div>
  );
}
