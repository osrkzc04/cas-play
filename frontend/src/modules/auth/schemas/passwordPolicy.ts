import { z } from "zod";

// Política de contraseñas segura, compartida por el cambio y el restablecimiento
// de contraseña. Debe mantenerse sincronizada con el backend
// (backend/app/shared/password.py).
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
// Se admite cualquier símbolo (carácter no alfanumérico, excluyendo espacios);
// el hint solo orienta con ejemplos. Debe coincidir con el backend.
export const PASSWORD_SPECIAL_HINT = "@ # $ % & * ! ? . -";

interface PasswordCriterion {
  id: string;
  label: string;
  test: (value: string) => boolean;
}

export const passwordCriteria: PasswordCriterion[] = [
  {
    id: "length",
    label: `Al menos ${PASSWORD_MIN_LENGTH} caracteres`,
    test: (value) => value.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: "uppercase",
    label: "Una letra mayúscula",
    test: (value) => /[A-Z]/.test(value),
  },
  {
    id: "lowercase",
    label: "Una letra minúscula",
    test: (value) => /[a-z]/.test(value),
  },
  { id: "number", label: "Un número", test: (value) => /[0-9]/.test(value) },
  {
    id: "special",
    label: `Un símbolo (p. ej. ${PASSWORD_SPECIAL_HINT})`,
    test: (value) => /[^A-Za-z0-9\s]/.test(value),
  },
];

export interface PasswordCriterionState {
  id: string;
  label: string;
  met: boolean;
}

// Evalúa cada criterio para el checklist en vivo del formulario.
export function evaluatePassword(value: string): PasswordCriterionState[] {
  const safeValue = value ?? "";
  return passwordCriteria.map(({ id, label, test }) => ({
    id,
    label,
    met: test(safeValue),
  }));
}

// Un único mensaje de error basta: el checklist detalla qué falta.
export const passwordSchema = z
  .string()
  .max(
    PASSWORD_MAX_LENGTH,
    `La contraseña no puede superar ${PASSWORD_MAX_LENGTH} caracteres`,
  )
  .refine(
    (value) => passwordCriteria.every(({ test }) => test(value)),
    { message: "La contraseña no cumple los requisitos de seguridad" },
  );
