import { cn } from "@/shared/lib/cn";

interface ProgressBarProps {
  value: number;
  className?: string;
  /** Muestra el porcentaje numérico a la derecha de la barra. */
  showValue?: boolean;
}

// Barra de progreso institucional: 4px, track gris, relleno rojo. Al alcanzar
// el 100% el relleno pasa a oro para señalar el logro (identidad CAS).
export function ProgressBar({ value, className, showValue }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const complete = clamped >= 100;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className="h-1 flex-1 overflow-hidden rounded-full bg-gray-200"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${clamped}% completado`}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all",
            complete ? "bg-gold-500" : "bg-brand-600",
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showValue && (
        <span
          className={cn(
            "w-10 shrink-0 text-right text-xs font-semibold tabular-nums",
            complete ? "text-gold-600" : "text-gray-600",
          )}
        >
          {clamped}%
        </span>
      )}
    </div>
  );
}
