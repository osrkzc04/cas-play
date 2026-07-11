import { z } from "zod";

export const adminEnrollmentSchema = z.object({
  email: z.string().email("Ingresa un correo válido"),
  course_id: z.string().min(1, "Selecciona un curso"),
  first_name: z
    .string()
    .max(100, "El nombre no puede superar 100 caracteres")
    .optional()
    .or(z.literal("")),
  last_name: z
    .string()
    .max(100, "El apellido no puede superar 100 caracteres")
    .optional()
    .or(z.literal("")),
});

export type AdminEnrollmentValues = z.infer<typeof adminEnrollmentSchema>;
