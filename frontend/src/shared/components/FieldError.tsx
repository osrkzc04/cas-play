import { AlertCircle } from "lucide-react";

interface FieldErrorProps {
  message?: string;
}

// El feedback de error nunca es solo color: siempre icono + texto (WCAG AA).
export function FieldError({ message }: FieldErrorProps) {
  if (!message) {
    return null;
  }
  return (
    <p className="flex items-center gap-1 text-xs font-medium text-brand-700">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}
