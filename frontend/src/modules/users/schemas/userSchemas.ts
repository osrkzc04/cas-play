import { z } from "zod";

const baseUserSchema = {
  first_name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede superar 100 caracteres"),
  last_name: z
    .string()
    .trim()
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .max(100, "El apellido no puede superar 100 caracteres"),
  email: z.string().email("Ingresa un correo válido"),
  role_id: z.string().min(1, "Selecciona un rol"),
};

export const createUserSchema = z.object({
  ...baseUserSchema,
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;

export const editUserSchema = z.object({
  ...baseUserSchema,
  is_active: z.boolean(),
});

export type EditUserFormValues = z.infer<typeof editUserSchema>;
