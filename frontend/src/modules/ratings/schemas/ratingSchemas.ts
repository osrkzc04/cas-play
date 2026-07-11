import { z } from "zod";

export const ratingSchema = z.object({
  score: z
    .number({ invalid_type_error: "Selecciona una calificación" })
    .int()
    .min(1, "Selecciona una calificación")
    .max(5),
  comment: z
    .string()
    .trim()
    .max(1000, "El comentario no puede superar 1000 caracteres")
    .optional()
    .or(z.literal("")),
});

export type RatingFormValues = z.infer<typeof ratingSchema>;
