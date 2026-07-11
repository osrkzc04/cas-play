import { z } from "zod";

const title = z
  .string()
  .trim()
  .min(3, "El título debe tener al menos 3 caracteres")
  .max(150, "El título no puede superar 150 caracteres");

const description = z
  .string()
  .trim()
  .max(5000, "La descripción no puede superar 5000 caracteres")
  .optional()
  .or(z.literal(""));

export const moduleSchema = z.object({
  title,
  description,
});

export type ModuleFormValues = z.infer<typeof moduleSchema>;

export const lessonSchema = z.object({
  title,
  description,
  is_preview: z.boolean(),
});

export type LessonFormValues = z.infer<typeof lessonSchema>;
