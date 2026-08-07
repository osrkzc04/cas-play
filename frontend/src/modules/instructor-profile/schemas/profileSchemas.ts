import { z } from "zod";

// URL opcional: permite dejar el campo vacío o una URL válida.
const optionalUrl = z
  .string()
  .trim()
  .url("Ingresa una URL válida")
  .or(z.literal(""));

export const instructorProfileSchema = z.object({
  headline: z
    .string()
    .trim()
    .max(150, "El titular no puede superar 150 caracteres"),
  specialty: z
    .string()
    .trim()
    .max(120, "La especialidad no puede superar 120 caracteres"),
  about_me: z
    .string()
    .trim()
    .max(2000, "«Sobre mí» no puede superar 2000 caracteres"),
  linkedin: optionalUrl,
  instagram: optionalUrl,
  youtube: optionalUrl,
});

export type InstructorProfileFormValues = z.infer<typeof instructorProfileSchema>;
