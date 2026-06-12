import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Ingresa un correo válido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const passwordResetRequestSchema = z.object({
  email: z.string().email("Ingresa un correo válido"),
});

export type PasswordResetRequestValues = z.infer<
  typeof passwordResetRequestSchema
>;

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, "El token es obligatorio"),
  new_password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(128, "La contraseña no puede superar 128 caracteres"),
});

export type PasswordResetConfirmValues = z.infer<
  typeof passwordResetConfirmSchema
>;
