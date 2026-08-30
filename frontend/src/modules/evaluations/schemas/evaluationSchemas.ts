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

// Pregunta del banco: enunciado + 2..6 opciones con una marcada como correcta.
// Verdadero/Falso reutiliza el mismo esquema con dos opciones fijas.
export const questionSchema = z
  .object({
    statement: z
      .string()
      .trim()
      .min(1, "Ingresa el enunciado de la pregunta.")
      .max(1000, "El enunciado no puede superar 1000 caracteres"),
    question_type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE"]),
    options: z
      .array(
        z.object({
          text: z
            .string()
            .trim()
            .min(1, "Todas las opciones deben tener texto."),
        }),
      )
      .min(2)
      .max(6),
    correctIndex: z.number().int().min(0),
  })
  .refine((data) => data.correctIndex < data.options.length, {
    message: "Selecciona la opción correcta.",
    path: ["correctIndex"],
  });

export type QuestionFormValues = z.infer<typeof questionSchema>;
