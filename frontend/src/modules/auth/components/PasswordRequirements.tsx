import { Check, X } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { evaluatePassword } from "../schemas/passwordPolicy";

interface PasswordRequirementsProps {
  value: string;
}

// Checklist en vivo de la política de contraseña. El estado nunca es solo color:
// icono (check/x) + texto, para cumplir accesibilidad (WCAG AA).
export function PasswordRequirements({ value }: PasswordRequirementsProps) {
  const criteria = evaluatePassword(value);

  return (
    <ul
      className="flex flex-col gap-1"
      aria-label="Requisitos de la contraseña"
    >
      {criteria.map(({ id, label, met }) => (
        <li
          key={id}
          className={cn(
            "flex items-center gap-1.5 text-xs",
            met ? "text-green-700" : "text-gray-500",
          )}
        >
          {met ? (
            <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          ) : (
            <X className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          )}
          <span>{label}</span>
          <span className="sr-only">{met ? "cumplido" : "pendiente"}</span>
        </li>
      ))}
    </ul>
  );
}
