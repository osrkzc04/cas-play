import { z } from "zod";

const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message).optional().or(z.literal(""));

const topicItemSchema = z.object({
  content: z
    .string()
    .trim()
    .min(3, "Cada ítem debe tener al menos 3 caracteres")
    .max(300, "Cada ítem no puede superar 300 caracteres"),
});

export const courseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(150, "El título no puede superar 150 caracteres"),
  summary: optionalText(300, "El resumen no puede superar 300 caracteres"),
  description: optionalText(
    5000,
    "La descripción no puede superar 5000 caracteres",
  ),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional().or(z.literal("")),
  duration_hours: z
    .union([z.coerce.number().int().min(0).max(1000), z.literal("")])
    .optional(),
  requirements: optionalText(
    5000,
    "Los requisitos no pueden superar 5000 caracteres",
  ),
  target_audience: optionalText(
    5000,
    "El público objetivo no puede superar 5000 caracteres",
  ),
  // Temario informativo del curso.
  topics: z.array(topicItemSchema),
});

export type CourseFormValues = z.infer<typeof courseSchema>;
