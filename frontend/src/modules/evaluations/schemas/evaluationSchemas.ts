import { z } from "zod";

export const evaluationSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(150, "El título no puede superar 150 caracteres"),
  description: z
    .string()
    .trim()
    .max(5000, "La descripción no puede superar 5000 caracteres")
    .optional()
    .or(z.literal("")),
});

export type EvaluationFormValues = z.infer<typeof evaluationSchema>;
